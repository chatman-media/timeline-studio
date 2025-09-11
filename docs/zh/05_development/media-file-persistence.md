# User Guide: Media File Persistence in Projects

## Overview

Timeline Studio automatically saves references to all imported media files in project files. This means that when you reopen a project, all your media files will be automatically restored.

## How It Works

### 1. Media Import

When you import media files or music into Timeline Studio:

1. **Files are added to the media browser** - as usual
2. **References are automatically saved** - to the current project (if a project is open)
3. **Project is marked as modified** - unsaved changes indicator appears

> 💡 **Tip**: If no project is open, imported files will only be available in the current session.

### 2. Project Saving

When saving a project (Ctrl+S or File → Save):

1. **Project settings are saved** - resolution, frame rate, etc.
2. **Media library is saved** - all imported files
3. **Browser state is saved** - sorting, filters, favorites

### 3. Project Opening

When opening a saved project:

1. **Project settings are loaded**
2. **Media files are automatically restored**
3. **File availability is checked**
4. **Recovery dialog is shown if needed**

## File Path Types

### Absolute Paths

For files outside the project directory, full paths are saved:

```
/Users/username/Videos/vacation.mp4
C:\Users\Username\Documents\video.mp4
```

### Relative Paths

For files inside the project directory, relative paths are saved:

```
Project: /Users/username/Projects/MyProject.tls
File:    /Users/username/Projects/media/video.mp4
Path:    media/video.mp4
```

> ✅ **Advantage**: Project can be moved between computers and files will be found automatically.

## Missing File Recovery

### When Files May Be Missing

- Files were moved or renamed
- Project opened on different computer
- External drive disconnected
- Files were deleted

### Recovery Dialog

If some files are not found when opening a project, the "Missing Media Files" dialog will appear:

#### File Information

- **File name** - original name
- **Path** - where file should be located
- **Size** - file size for verification
- **Status** - current state

#### Actions for Each File

1. **🔍 Find File**

   - Opens file selection dialog
   - Automatically filters by file type
   - Verifies selected file matches

2. **🗑️ Remove from Project**

   - Removes file reference from project
   - File will no longer appear in media browser

3. **❌ Skip**
   - Leaves file in missing list
   - Can be processed later

#### Batch Operations

- **Apply Changes** - applies all selected actions
- **Skip All** - closes dialog without changes

### Automatic Search

Before showing the dialog, the system automatically searches for files in:

1. **Original location** - by saved path
2. **Relative path** - if file was in project subdirectory
3. **Standard project folders**:
   - `media/` - media files folder
   - `assets/` - resources folder
   - `files/` - general files folder

## File Organization Recommendations

### Project Structure

Recommended structure for better portability:

```
MyProject/
├── MyProject.tls          # Project file
├── media/                  # Media files
│   ├── videos/
│   ├── audio/
│   └── images/
├── assets/                 # Additional resources
└── exports/               # Exported files
```

### File Management Tips

1. **Create project folder** before importing files
2. **Copy files to project folder** for better portability
3. **Use clear names** for files and folders
4. **Avoid special characters** in file names
5. **Save project regularly** to preserve changes

## File Statuses

### In Media Browser

- **✅ Available** - file found and accessible
- **🔄 Moved** - file found in new location
- **❌ Missing** - file not found
- **⚠️ Corrupted** - file found but modified

### Indicators

- **Green border** - file restored successfully
- **Yellow border** - file found in new location
- **Red border** - file missing or corrupted

## Troubleshooting

### File Not Found Automatically

1. **Check original location** of the file
2. **Find file manually** through recovery dialog
3. **Check file name** - it must match exactly
4. **Check file size** - it should match saved size

### File Found But Marked as Corrupted

1. **Check file size** - file may have been modified
2. **Check modification date** - file may have been updated
3. **Try reimporting** the file

### Project Not Saving Media Files

1. **Ensure project is saved** (Ctrl+S)
2. **Check access permissions** to project file
3. **Check free disk space**
4. **Restart application** if problem persists

### Recovery Dialog Not Appearing

1. **Check settings** - automatic recovery may be disabled
2. **Check logs** in developer console (F12)
3. **Try reopening project**

## Limitations

### Performance

- **Maximum 1000 files** per project (recommendation)
- **Project size up to 10 MB** for optimal performance
- **30 second timeout** for recovery operations

### Compatibility

- **All Timeline Studio media formats** supported
- **Projects compatible** between application versions
- **Cross-platform** - projects work on Windows, macOS, Linux

### Security

- **Project files don't contain** actual media files, only references
- **File paths are saved** in plain text in project file
- **File access** limited by operating system permissions

## Frequently Asked Questions

**Q: Are actual media files saved in the project?**
A: No, only file references are saved in the project. Files remain in their original location.

**Q: Can I transfer a project to another computer?**
A: Yes, but you need to transfer all media files too. It's best to use relative paths.

**Q: What happens when a media file is deleted from disk?**
A: When the project is next opened, the file will be marked as missing and a recovery dialog will appear.

**Q: Can files be restored automatically?**
A: The system automatically searches for files in standard locations. If not found, manual intervention is required.

**Q: Does the number of files affect performance?**
A: With many files (>1000), project opening may slow down. It's recommended to split large projects into parts.