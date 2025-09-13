fn main() {
  // Clear any FFmpeg environment variables that might be incorrectly set
  // This prevents cross-platform build issues where Windows paths might leak into Linux builds
  if std::env::var("CI").is_ok() {
    // In CI environment, ensure we use system FFmpeg via pkg-config
    unsafe { std::env::remove_var("FFMPEG_DIR") };
    unsafe { std::env::remove_var("FFMPEG_INCLUDE_DIR") };
    unsafe { std::env::remove_var("FFMPEG_LIB_DIR") };

    // Set PKG_CONFIG to use system libraries
    if cfg!(target_os = "linux") {
      unsafe { std::env::set_var("PKG_CONFIG_ALLOW_SYSTEM_LIBS", "1") };
      unsafe { std::env::set_var("PKG_CONFIG_ALLOW_SYSTEM_CFLAGS", "1") };

      // Help bindgen find system headers
      if std::env::var("BINDGEN_EXTRA_CLANG_ARGS").is_err() {
        unsafe {
          std::env::set_var(
            "BINDGEN_EXTRA_CLANG_ARGS",
            "-I/usr/include -I/usr/include/x86_64-linux-gnu",
          )
        };
      }
    }

    // Clean up test binaries that should not be included in release builds
    cleanup_test_binaries();
  }

  // Run the default Tauri build script
  tauri_build::build();
}

fn cleanup_test_binaries() {
  use std::fs;
  use std::path::Path;

  println!("🧹 Starting test binary cleanup in CI environment...");

  // List of test binaries to remove before bundling
  let test_binaries = [
    "test_specta",
    "test_specta.exe", // Windows
    "generate_types",
    "generate_types.exe", // Windows
    "export_types",
    "export_types.exe", // Windows
  ];

  // Get current directory and check both relative and absolute paths
  let current_dir = std::env::current_dir().unwrap_or_else(|_| Path::new(".").to_path_buf());
  println!("📁 Current directory: {current_dir:?}");

  // Check target directories (both relative and absolute paths)
  let target_dirs = [
    "target/debug",
    "target/release",
    "target/universal-apple-darwin/debug",
    "target/universal-apple-darwin/release",
    "target/x86_64-apple-darwin/debug",
    "target/x86_64-apple-darwin/release",
    "target/aarch64-apple-darwin/debug",
    "target/aarch64-apple-darwin/release",
    // Also check absolute paths in case working directory is different
    &format!("{}/target/debug", current_dir.display()),
    &format!("{}/target/release", current_dir.display()),
    &format!(
      "{}/target/universal-apple-darwin/debug",
      current_dir.display()
    ),
    &format!(
      "{}/target/universal-apple-darwin/release",
      current_dir.display()
    ),
  ];

  let mut removed_count = 0;

  for target_dir in &target_dirs {
    let target_path = Path::new(target_dir);
    if target_path.exists() {
      println!("📂 Checking directory: {target_path:?}");
      for binary in &test_binaries {
        let binary_path = target_path.join(binary);
        if binary_path.exists() {
          if let Err(e) = fs::remove_file(&binary_path) {
            eprintln!("⚠️  Warning: Failed to remove test binary {binary_path:?}: {e}");
          } else {
            println!("🗑️  Removed test binary: {binary_path:?}");
            removed_count += 1;
          }
        }
      }
    }
  }

  // Also try to clean Cargo cache if we're in CI
  if std::env::var("CI").is_ok() {
    println!("🧹 Cleaning Cargo target in CI environment...");

    // Try to remove any .d files that might reference test_specta
    for target_dir in &target_dirs {
      let target_path = Path::new(target_dir);
      if target_path.exists() {
        if let Ok(entries) = fs::read_dir(target_path) {
          for entry in entries.flatten() {
            let path = entry.path();
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
              if (name.contains("test_specta")
                || name.contains("generate_types")
                || name.contains("export_types"))
                && (name.ends_with(".d") || name.ends_with(".pdb"))
              {
                if let Err(e) = fs::remove_file(&path) {
                  eprintln!("⚠️  Warning: Failed to remove cache file {path:?}: {e}");
                } else {
                  println!("🗑️  Removed cache file: {path:?}");
                  removed_count += 1;
                }
              }
            }
          }
        }
      }
    }
  }

  if removed_count == 0 {
    println!("✅ No test binaries found to clean");
  } else {
    println!("✅ Cleaned up {removed_count} test-related files");
  }
}
