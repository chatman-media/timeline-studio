# Timeline Studio Documentation

<div id="language-selector">
  <script>
    // Автоматическое определение языка пользователя
    const userLang = navigator.language || navigator.userLanguage;
    const langCode = userLang.substring(0, 2);
    
    // Поддерживаемые языки
    const supportedLangs = {
      'en': { name: 'English', flag: '🇬🇧', path: 'en/' },
      'ru': { name: 'Русский', flag: '🇷🇺', path: 'ru/' },
      'zh': { name: '中文', flag: '🇨🇳', path: 'zh/' }
    };
    
    // Определение языка по умолчанию
    const defaultLang = supportedLangs[langCode] ? langCode : 'en';
    
    // Создание селектора языков
    function createLanguageSelector() {
      let html = '<div style="text-align: center; margin: 20px 0;">\n';
      html += '<h2>Choose your language / Выберите язык / 选择语言</h2>\n';
      html += '<div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">\n';
      
      for (const [code, lang] of Object.entries(supportedLangs)) {
        const isDefault = code === defaultLang;
        const style = isDefault ? 
          'background: #0066cc; color: white; border: 2px solid #0066cc;' : 
          'background: #f5f5f5; color: #333; border: 2px solid #ddd;';
        
        html += `<a href="${lang.path}" style="${style} padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; transition: all 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">`;
        html += `${lang.flag} ${lang.name}`;
        if (isDefault) html += ' (Recommended)';
        html += '</a>\n';
      }
      
      html += '</div>\n';
      html += '</div>\n';
      
      return html;
    }
    
    // Вставка селектора
    document.addEventListener('DOMContentLoaded', function() {
      const selector = document.getElementById('language-selector');
      if (selector) {
        selector.innerHTML = createLanguageSelector();
      }
    });
  </script>
</div>

## 🇬🇧 [English Documentation](en/)
Complete documentation in English with all project details, API references, and development guides.

## 🇷🇺 [Русская документация](ru/)
Полная документация на русском языке со всеми деталями проекта, справочниками API и руководствами по разработке.

## 🇨🇳 [中文文档](zh/)
完整的中文文档，包含所有项目详情、API参考和开发指南。

---

### About this documentation system / О системе документации / 关于此文档系统

**English:** This documentation provides complete project context for developers and AI assistants, with structured information about all aspects and current development state.

**Русский:** Эта документация обеспечивает полный контекст проекта для разработчиков и AI-ассистентов, со структурированной информацией по всем аспектам и текущему состоянию разработки.

**中文:** 此文档为开发人员和AI助手提供完整的项目上下文，包含所有方面的结构化信息和当前开发状态。

---

*Documentation structure follows industry best practices and is optimized for both human readers and AI assistants.*