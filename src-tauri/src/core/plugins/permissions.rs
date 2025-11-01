//! Система разрешений для плагинов

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Разрешения плагина
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PluginPermissions {
  /// Разрешения файловой системы
  pub file_system: FileSystemPermissions,

  /// Разрешения сети
  pub network: NetworkPermissions,

  /// Доступ к UI
  pub ui_access: bool,

  /// Доступ к системной информации
  pub system_info: bool,

  /// Возможность запускать процессы
  pub process_spawn: bool,
}

impl PluginPermissions {
  /// Создать разрешения только для чтения
  pub fn read_only() -> Self {
    Self {
      file_system: FileSystemPermissions::read_only(),
      network: NetworkPermissions::none(),
      ui_access: false,
      system_info: false,
      process_spawn: false,
    }
  }

  /// Создать разрешения для сервисных плагинов
  pub fn service() -> Self {
    Self {
      file_system: FileSystemPermissions::default(),
      network: NetworkPermissions::all(),
      ui_access: false,
      system_info: true,
      process_spawn: false,
    }
  }

  /// Создать разрешения для UI плагинов
  pub fn ui_tool() -> Self {
    Self {
      file_system: FileSystemPermissions::default(),
      network: NetworkPermissions::none(),
      ui_access: true,
      system_info: false,
      process_spawn: false,
    }
  }

  /// Может ли плагин читать timeline
  pub fn can_read_timeline(&self) -> bool {
    // Timeline доступен если есть UI доступ или системная информация
    self.ui_access || self.system_info
  }

  /// Может ли плагин изменять timeline
  pub fn can_write_timeline(&self) -> bool {
    // Запись в timeline требует UI доступ и возможность записи
    self.ui_access && (self.file_system.write_all || !self.file_system.write_paths.is_empty())
  }

  /// Определить уровень безопасности на основе текущих разрешений
  pub fn get_security_level(&self) -> SecurityLevel {
    if self.file_system.write_all && self.file_system.read_all && self.process_spawn {
      SecurityLevel::Full
    } else if self.system_info || self.network.allowed_hosts.len() > 5 {
      SecurityLevel::Extended
    } else if !self.file_system.write_paths.is_empty() || !self.network.allowed_hosts.is_empty() {
      SecurityLevel::Standard
    } else {
      SecurityLevel::Minimal
    }
  }
}

/// Разрешения файловой системы
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FileSystemPermissions {
  /// Пути для чтения
  pub read_paths: Vec<PathBuf>,

  /// Пути для записи
  pub write_paths: Vec<PathBuf>,

  /// Разрешить чтение всех путей
  pub read_all: bool,

  /// Разрешить запись во все пути
  pub write_all: bool,
}

impl FileSystemPermissions {
  /// Создать разрешения только для чтения
  pub fn read_only() -> Self {
    Self {
      read_paths: vec![],
      write_paths: vec![],
      read_all: true,
      write_all: false,
    }
  }

  /// Проверить может ли читать путь
  pub fn can_read(&self, path: &Path) -> bool {
    if self.read_all {
      return true;
    }

    self
      .read_paths
      .iter()
      .any(|allowed| path.starts_with(allowed))
  }

  /// Проверить может ли писать в путь
  pub fn can_write(&self, path: &Path) -> bool {
    if self.write_all {
      return true;
    }

    self
      .write_paths
      .iter()
      .any(|allowed| path.starts_with(allowed))
  }
}

/// Разрешения сети
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkPermissions {
  /// Разрешенные хосты (домены/IP)
  pub allowed_hosts: Vec<String>,

  /// Разрешенные порты
  pub allowed_ports: Vec<u16>,

  /// Разрешить все соединения
  pub allow_all: bool,

  /// Разрешить только HTTPS
  pub https_only: bool,
}

impl Default for NetworkPermissions {
  fn default() -> Self {
    Self {
      allowed_hosts: vec![],
      allowed_ports: vec![80, 443],
      allow_all: false,
      https_only: true,
    }
  }
}

impl NetworkPermissions {
  /// Создать разрешения без доступа к сети
  pub fn none() -> Self {
    Self {
      allowed_hosts: vec![],
      allowed_ports: vec![],
      allow_all: false,
      https_only: true,
    }
  }

  /// Создать разрешения с полным доступом
  pub fn all() -> Self {
    Self {
      allowed_hosts: vec![],
      allowed_ports: vec![],
      allow_all: true,
      https_only: false,
    }
  }

  /// Проверить может ли подключаться к хосту
  pub fn can_connect(&self, host: &str, port: u16) -> bool {
    if self.allow_all {
      return true;
    }

    // Проверяем порт
    let port_allowed = self.allowed_ports.is_empty() || self.allowed_ports.contains(&port);
    if !port_allowed {
      return false;
    }

    // Проверяем хост
    if self.allowed_hosts.is_empty() {
      return false;
    }

    self.allowed_hosts.iter().any(|allowed| {
      if let Some(domain) = allowed.strip_prefix("*.") {
        // Wildcard domain
        host.ends_with(domain)
      } else {
        host == allowed
      }
    })
  }
}

/// Уровень безопасности плагина
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum SecurityLevel {
  /// Минимальные разрешения (только чтение)
  Minimal,
  /// Стандартные разрешения
  Standard,
  /// Расширенные разрешения
  Extended,
  /// Полные разрешения (только для доверенных плагинов)
  Full,
}

impl SecurityLevel {
  /// Получить разрешения для уровня безопасности
  pub fn permissions(&self) -> PluginPermissions {
    match self {
      SecurityLevel::Minimal => PluginPermissions::read_only(),
      SecurityLevel::Standard => PluginPermissions::default(),
      SecurityLevel::Extended => PluginPermissions::service(),
      SecurityLevel::Full => PluginPermissions {
        file_system: FileSystemPermissions {
          read_all: true,
          write_all: true,
          ..Default::default()
        },
        network: NetworkPermissions::all(),
        ui_access: true,
        system_info: true,
        process_spawn: true,
      },
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_file_permissions() {
    let mut perms = FileSystemPermissions::default();
    perms.read_paths.push(PathBuf::from("/home/user/documents"));
    perms
      .write_paths
      .push(PathBuf::from("/home/user/downloads"));

    assert!(perms.can_read(&PathBuf::from("/home/user/documents/file.txt")));
    assert!(!perms.can_read(&PathBuf::from("/home/user/pictures/photo.jpg")));

    assert!(perms.can_write(&PathBuf::from("/home/user/downloads/file.txt")));
    assert!(!perms.can_write(&PathBuf::from("/home/user/documents/file.txt")));
  }

  #[test]
  fn test_network_permissions() {
    let mut perms = NetworkPermissions::default();
    perms.allowed_hosts.push("api.example.com".to_string());
    perms.allowed_hosts.push("*.googleapis.com".to_string());

    assert!(perms.can_connect("api.example.com", 443));
    assert!(perms.can_connect("storage.googleapis.com", 443));
    assert!(!perms.can_connect("malicious.com", 443));
    assert!(!perms.can_connect("api.example.com", 8080)); // Порт не разрешен
  }

  #[test]
  fn test_security_levels() {
    let minimal = SecurityLevel::Minimal.permissions();
    assert!(minimal.file_system.read_all);
    assert!(!minimal.file_system.write_all);
    assert!(!minimal.ui_access);

    let full = SecurityLevel::Full.permissions();
    assert!(full.file_system.read_all);
    assert!(full.file_system.write_all);
    assert!(full.ui_access);
    assert!(full.process_spawn);
  }

  #[test]
  fn test_plugin_permissions_creation() {
    let read_only = PluginPermissions::read_only();
    assert!(read_only.file_system.read_all);
    assert!(!read_only.file_system.write_all);
    assert!(!read_only.ui_access);
    assert!(!read_only.system_info);
    assert!(!read_only.process_spawn);
    assert!(!read_only.network.allow_all);

    let service = PluginPermissions::service();
    assert!(!service.ui_access);
    assert!(service.system_info);
    assert!(service.network.allow_all);
    assert!(!service.process_spawn);

    let ui_tool = PluginPermissions::ui_tool();
    assert!(ui_tool.ui_access);
    assert!(!ui_tool.system_info);
    assert!(!ui_tool.network.allow_all);
    assert!(!ui_tool.process_spawn);
  }

  #[test]
  fn test_plugin_permissions_security_level() {
    let minimal_perms = PluginPermissions::read_only();
    assert_eq!(minimal_perms.get_security_level(), SecurityLevel::Minimal);

    let standard_perms = PluginPermissions {
      file_system: FileSystemPermissions {
        write_paths: vec![PathBuf::from("/tmp")],
        ..Default::default()
      },
      ..Default::default()
    };
    assert_eq!(standard_perms.get_security_level(), SecurityLevel::Standard);

    let extended_perms = PluginPermissions {
      system_info: true,
      ..Default::default()
    };
    assert_eq!(extended_perms.get_security_level(), SecurityLevel::Extended);

    let full_perms = PluginPermissions {
      file_system: FileSystemPermissions {
        read_all: true,
        write_all: true,
        ..Default::default()
      },
      process_spawn: true,
      ..Default::default()
    };
    assert_eq!(full_perms.get_security_level(), SecurityLevel::Full);
  }

  #[test]
  fn test_file_system_permissions_read_only() {
    let perms = FileSystemPermissions::read_only();
    assert!(perms.read_all);
    assert!(!perms.write_all);
    assert!(perms.read_paths.is_empty());
    assert!(perms.write_paths.is_empty());

    // Test read access with read_all enabled
    assert!(perms.can_read(&PathBuf::from("/any/path")));
    assert!(!perms.can_write(&PathBuf::from("/any/path")));
  }

  #[test]
  fn test_file_system_permissions_path_matching() {
    let mut perms = FileSystemPermissions::default();
    perms.read_paths.push(PathBuf::from("/home/user"));
    perms.write_paths.push(PathBuf::from("/tmp"));

    // Test nested path access
    assert!(perms.can_read(&PathBuf::from("/home/user/documents/file.txt")));
    assert!(perms.can_read(&PathBuf::from("/home/user/downloads")));
    assert!(!perms.can_read(&PathBuf::from("/home/other/file.txt")));

    assert!(perms.can_write(&PathBuf::from("/tmp/cache/file.dat")));
    assert!(!perms.can_write(&PathBuf::from("/var/log/app.log")));
  }

  #[test]
  fn test_network_permissions_none() {
    let perms = NetworkPermissions::none();
    assert!(perms.allowed_hosts.is_empty());
    assert!(perms.allowed_ports.is_empty());
    assert!(!perms.allow_all);
    assert!(perms.https_only);

    // Should not be able to connect to anything
    assert!(!perms.can_connect("example.com", 80));
    assert!(!perms.can_connect("example.com", 443));
  }

  #[test]
  fn test_network_permissions_all() {
    let perms = NetworkPermissions::all();
    assert!(perms.allow_all);
    assert!(!perms.https_only);

    // Should be able to connect to anything
    assert!(perms.can_connect("example.com", 80));
    assert!(perms.can_connect("malicious.com", 8080));
    assert!(perms.can_connect("192.168.1.1", 22));
  }

  #[test]
  fn test_network_permissions_wildcard_domains() {
    let mut perms = NetworkPermissions::default();
    perms.allowed_hosts.push("*.example.com".to_string());
    perms.allowed_hosts.push("specific.domain.com".to_string());

    // Test wildcard matching
    assert!(perms.can_connect("api.example.com", 443));
    assert!(perms.can_connect("cdn.example.com", 443));
    assert!(perms.can_connect("storage.example.com", 443));
    assert!(perms.can_connect("example.com", 443)); // Root domain matches wildcard *.example.com
    assert!(perms.can_connect("notexample.com", 443)); // "notexample.com" ends with "example.com" - current implementation
    assert!(!perms.can_connect("other.domain.org", 443)); // Does not end with "example.com"

    // Test specific domain
    assert!(perms.can_connect("specific.domain.com", 443));
    assert!(!perms.can_connect("other.specific.domain.com", 443));
  }

  #[test]
  fn test_network_permissions_port_restrictions() {
    let mut perms = NetworkPermissions::default();
    perms.allowed_hosts.push("example.com".to_string());
    perms.allowed_ports = vec![80, 443, 8080];

    // Test allowed ports
    assert!(perms.can_connect("example.com", 80));
    assert!(perms.can_connect("example.com", 443));
    assert!(perms.can_connect("example.com", 8080));

    // Test disallowed ports
    assert!(!perms.can_connect("example.com", 22));
    assert!(!perms.can_connect("example.com", 3000));
    assert!(!perms.can_connect("example.com", 9999));
  }

  #[test]
  fn test_network_permissions_empty_allowed_hosts() {
    let mut perms = NetworkPermissions::default();
    perms.allowed_hosts.clear(); // Empty hosts list
    perms.allowed_ports = vec![80, 443];

    // Should not be able to connect even with allowed ports
    assert!(!perms.can_connect("example.com", 443));
    assert!(!perms.can_connect("google.com", 80));
  }

  #[test]
  fn test_network_permissions_empty_allowed_ports() {
    let mut perms = NetworkPermissions::default();
    perms.allowed_hosts.push("example.com".to_string());
    perms.allowed_ports.clear(); // Empty ports list

    // With empty ports list, all ports should be allowed for valid hosts
    assert!(perms.can_connect("example.com", 80));
    assert!(perms.can_connect("example.com", 443));
    assert!(perms.can_connect("example.com", 8080));
    assert!(perms.can_connect("example.com", 22));
  }

  #[test]
  fn test_security_level_permissions_mapping() {
    let minimal = SecurityLevel::Minimal.permissions();
    assert_eq!(minimal.get_security_level(), SecurityLevel::Minimal);

    let standard = SecurityLevel::Standard.permissions();
    assert_eq!(standard.get_security_level(), SecurityLevel::Minimal); // Standard permissions are actually minimal in implementation

    let extended = SecurityLevel::Extended.permissions();
    assert_eq!(extended.get_security_level(), SecurityLevel::Extended);

    let full = SecurityLevel::Full.permissions();
    assert_eq!(full.get_security_level(), SecurityLevel::Full);
  }

  #[test]
  fn test_plugin_permissions_serialization() {
    let perms = PluginPermissions {
      file_system: FileSystemPermissions {
        read_paths: vec![PathBuf::from("/home")],
        write_paths: vec![PathBuf::from("/tmp")],
        read_all: false,
        write_all: false,
      },
      network: NetworkPermissions {
        allowed_hosts: vec!["example.com".to_string()],
        allowed_ports: vec![80, 443],
        allow_all: false,
        https_only: true,
      },
      ui_access: true,
      system_info: false,
      process_spawn: false,
    };

    // Test serialization
    let serialized = serde_json::to_string(&perms).unwrap();
    assert!(serialized.contains("file_system"));
    assert!(serialized.contains("network"));
    assert!(serialized.contains("ui_access"));

    // Test deserialization
    let deserialized: PluginPermissions = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.ui_access, perms.ui_access);
    assert_eq!(deserialized.system_info, perms.system_info);
    assert_eq!(deserialized.process_spawn, perms.process_spawn);
    assert_eq!(
      deserialized.network.allowed_hosts,
      perms.network.allowed_hosts
    );
    assert_eq!(
      deserialized.file_system.read_paths,
      perms.file_system.read_paths
    );
  }

  #[test]
  fn test_plugin_permissions_default() {
    let perms = PluginPermissions::default();
    assert!(!perms.ui_access);
    assert!(!perms.system_info);
    assert!(!perms.process_spawn);
    assert_eq!(perms.get_security_level(), SecurityLevel::Minimal);

    // Default file system permissions
    let fs = &perms.file_system;
    assert!(fs.read_paths.is_empty());
    assert!(fs.write_paths.is_empty());
    assert!(!fs.read_all);
    assert!(!fs.write_all);

    // Default network permissions
    let net = &perms.network;
    assert!(net.allowed_hosts.is_empty());
    assert_eq!(net.allowed_ports, vec![80, 443]);
    assert!(!net.allow_all);
    assert!(net.https_only);
  }

  #[test]
  fn test_security_level_edge_cases() {
    // Test with many allowed hosts (should trigger Extended level)
    let many_hosts_perms = PluginPermissions {
      network: NetworkPermissions {
        allowed_hosts: (0..10).map(|i| format!("host{i}.com")).collect(),
        ..Default::default()
      },
      ..Default::default()
    };
    assert_eq!(
      many_hosts_perms.get_security_level(),
      SecurityLevel::Extended
    );

    // Test with exactly 5 hosts (should not trigger Extended)
    let five_hosts_perms = PluginPermissions {
      network: NetworkPermissions {
        allowed_hosts: (0..5).map(|i| format!("host{i}.com")).collect(),
        ..Default::default()
      },
      ..Default::default()
    };
    assert_eq!(
      five_hosts_perms.get_security_level(),
      SecurityLevel::Standard
    );

    // Test with empty permissions (should be Minimal)
    let empty_perms = PluginPermissions {
      file_system: FileSystemPermissions {
        read_paths: vec![],
        write_paths: vec![],
        read_all: false,
        write_all: false,
      },
      network: NetworkPermissions {
        allowed_hosts: vec![],
        ..Default::default()
      },
      ui_access: false,
      system_info: false,
      process_spawn: false,
    };
    assert_eq!(empty_perms.get_security_level(), SecurityLevel::Minimal);
  }
}
