# File Manager CLI

A comprehensive command-line file manager built with Node.js and TypeScript.

## About

This project was developed as part of the **JavaScript Programming** course at **Tbilisi State University (TSU)**.

**Lecturer:** Miranda Makharashvili  
**GitHub:** [https://github.com/MiraMakh](https://github.com/MiraMakh)

---

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
  - [Navigation Commands](#navigation-commands)
  - [File Operations](#file-operations)
  - [Search Commands](#search-commands)
  - [Hash Commands](#hash-commands)
  - [Compression Commands](#compression-commands)
  - [OS Information](#os-information)
  - [Utility Commands](#utility-commands)
- [Command Reference](#command-reference)
- [Technologies Used](#technologies-used)

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/GeorgeShani/TSU-JavaScript-Project
   cd TSU-JavaScript-Project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

---

## Usage

Start the File Manager CLI:

```bash
npm run start
```

You can also specify a username:

```bash
npm run start -- --username=YourName
```

Once running, type `man` to see all available commands or `man <command>` for detailed help on a specific command.

To exit the program, type `.exit`, `exit`, `quit`, or `q`.

---

## Features

### Navigation Commands

Navigate through your file system with ease.

| Command | Description |
|---------|-------------|
| `up` | Move up one directory level (cannot go above home directory) |
| `cd <path>` | Change to the specified directory (absolute or relative path) |
| `ls` | List contents of current directory with details (name, type, size, modified date) |
| `pwd` | Print the current working directory path |

**Aliases:**
- `dir` → `ls`

**Example:**
```
> cd Documents
> ls
> up
> pwd
```

---

### File Operations

Create, read, modify, copy, move, and delete files and directories.

| Command | Description |
|---------|-------------|
| `cat <file>` | Display the contents of a file |
| `add <filename>` | Create a new empty file |
| `touch <filename>` | Create a new empty file (alias for add) |
| `write <filename> <content>` | Create or overwrite a file with content |
| `mkdir <dirname>` | Create a new directory |
| `rn <oldpath> <newname>` | Rename a file |
| `cp <source> <dest_dir>` | Copy a file to a directory |
| `move <source> <dest_dir>` | Move a file to a directory |
| `rm <file>` | Delete a file (requires confirmation) |
| `rmdir <dir>` | Delete an empty directory (requires confirmation) |
| `info <path>` | Display detailed file/directory information |

**Aliases:**
- `type` → `cat`
- `md` → `mkdir`
- `rename`, `mv` → `rn`
- `copy` → `cp`
- `del`, `delete` → `rm`
- `rd` → `rmdir`
- `stat` → `info`

**Example:**
```
> add notes.txt
> write notes.txt "Hello, World!"
> cat notes.txt
> mkdir backup
> cp notes.txt backup
> info notes.txt
```

---

### Search Commands

Find files and search for content within files.

| Command | Description |
|---------|-------------|
| `find <pattern> [path]` | Find files matching a pattern (supports `*` and `?` wildcards) |
| `grep <pattern> <path>` | Search for text within files (supports regex) |
| `where <text>` | Find files containing specific text in current directory |

**Aliases:**
- `search` → `find`

**Example:**
```
> find *.txt
> find report* Documents
> grep TODO ./src
> where function
```

**Wildcard Support:**
- `*` matches any number of characters
- `?` matches a single character

---

### Hash Commands

Calculate cryptographic hashes of files.

| Command | Description |
|---------|-------------|
| `hash <file> [algorithm]` | Calculate hash using specified algorithm (default: sha256) |
| `md5 <file>` | Calculate MD5 hash |
| `sha1 <file>` | Calculate SHA-1 hash |
| `sha256 <file>` | Calculate SHA-256 hash |
| `sha512 <file>` | Calculate SHA-512 hash |

**Supported Algorithms:** sha256, sha512, md5, sha1

**Example:**
```
> hash document.pdf
> hash document.pdf md5
> sha256 important.txt
```

---

### Compression Commands

Compress and decompress files using various algorithms.

| Command | Description |
|---------|-------------|
| `compress <source> <dest> [algorithm]` | Compress a file (default: brotli) |
| `decompress <source> <dest> [algorithm]` | Decompress a file (auto-detects algorithm) |
| `brotli <source> <dest>` | Compress using Brotli algorithm |
| `gzip <source> <dest>` | Compress using Gzip algorithm |
| `deflate <source> <dest>` | Compress using Deflate algorithm |
| `unbrotli <source> <dest>` | Decompress a Brotli file |
| `gunzip <source> <dest>` | Decompress a Gzip file |
| `inflate <source> <dest>` | Decompress a Deflate file |

**Supported Algorithms:**
- **Brotli** (`.br`) - Best compression ratio, slower
- **Gzip** (`.gz`) - Good balance of speed and compression
- **Deflate** (`.zz`) - Fast compression, moderate ratio

**Example:**
```
> compress largefile.txt largefile.txt.br brotli
> gzip document.txt document.txt.gz
> decompress archive.gz extracted.txt
> gunzip archive.gz output.txt
```

---

### OS Information

Display system information.

| Command | Description |
|---------|-------------|
| `os --EOL` | Show the End-Of-Line character for your OS |
| `os --cpus` | Display CPU information (model, speed, core count) |
| `os --homedir` | Show the home directory path |
| `os --username` | Display the system username |
| `os --architecture` | Show CPU architecture (e.g., x64, arm64) |
| `os --platform` | Display the operating system platform |
| `os --memory` | Show total and free memory |
| `sysinfo` | Display all system information at once |

**Aliases:**
- `systeminfo` → `sysinfo`

**Example:**
```
> os --cpus
> os --memory
> sysinfo
```

---

### Utility Commands

General utility commands for the CLI.

| Command | Description |
|---------|-------------|
| `man [command]` | Display help (all commands or specific command details) |
| `clear` | Clear the terminal screen |
| `version` | Display application version |
| `.exit` | Exit the File Manager |

**Aliases:**
- `help`, `?` → `man`
- `cls` → `clear`
- `ver`, `-v`, `--version` → `version`
- `exit`, `quit`, `q` → `.exit`

**Keyboard Shortcuts:**
- `Ctrl + C` - Interrupt current task / Press twice to exit
- `Ctrl + L` - Clear the screen

**Task Interruption:**

Long-running operations can be interrupted by pressing `Ctrl+C`. This includes:
- File searches (`find`, `grep`, `where`)
- File reading (`cat`)
- File copying/moving (`cp`, `move`)
- Hash calculations (`hash`, `md5`, `sha256`, etc.)
- Compression/decompression operations

When you press `Ctrl+C`:
- **During a task:** The operation is immediately cancelled and you return to the prompt
- **At the prompt:** Shows "Press Ctrl+C again to exit"
- **Twice quickly:** Exits the application

**Example:**
```
> man
> man cp
> version
> .exit
```

---

## Command Reference

### Quick Reference Table

| Category | Commands |
|----------|----------|
| **Navigation** | `up`, `cd`, `ls`, `pwd` |
| **File Operations** | `cat`, `add`, `touch`, `write`, `mkdir`, `rn`, `cp`, `move`, `rm`, `rmdir`, `info` |
| **Search** | `find`, `grep`, `where` |
| **Hash** | `hash`, `md5`, `sha1`, `sha256`, `sha512` |
| **Compression** | `compress`, `decompress`, `brotli`, `gzip`, `deflate`, `unbrotli`, `gunzip`, `inflate` |
| **OS Info** | `os`, `sysinfo` |
| **Utility** | `man`, `clear`, `version`, `.exit` |

---

## Technologies Used

### Runtime & Language
- **Node.js** - JavaScript runtime environment
- **TypeScript** - Typed superset of JavaScript

### Node.js Built-in Modules
- **fs** - File system operations (read, write, copy, delete)
- **path** - Cross-platform path manipulation
- **os** - Operating system information
- **crypto** - Cryptographic hash functions
- **zlib** - Compression algorithms (Brotli, Gzip, Deflate)
- **readline** - Line-by-line input reading
- **stream/promises** - Stream pipeline utilities

### Third-Party Packages
- **chalk** - Terminal text styling and colors
- **inquirer** - Interactive command-line prompts

### Development Tools
- **Jest** - Testing framework
- **ts-jest** - TypeScript support for Jest
- **ts-node** - TypeScript execution environment

### Design Patterns
- **Registry Pattern** - Command registration and lookup
- **Command Pattern** - Encapsulating commands as objects
- **Factory Pattern** - Creating compression/decompression streams
- **Facade Pattern** - Simplified interface over complex subsystems

### Async Patterns
- **AbortController/AbortSignal** - Task cancellation for long-running operations
- **Stream Processing** - Memory-efficient file handling with Node.js streams

---

## Project Structure

```
src/
├── cli/
│   ├── index.ts          # Application entry point
│   ├── cli.ts            # CLI class and event handling
│   ├── FileManager.ts    # File system operations
│   └── CommandRegistry.ts # Command registration and execution
├── commands/
│   ├── index.ts          # Command exports
│   ├── navigation.ts     # Navigation commands (cd, ls, up, pwd)
│   ├── fileOperations.ts # File CRUD commands
│   ├── search.ts         # Find and grep commands
│   ├── hash.ts           # Hash calculation commands
│   ├── compression.ts    # Compression commands
│   ├── osInfo.ts         # OS information commands
│   └── help.ts           # Help and utility commands
├── utils/
│   ├── index.ts          # Utility exports
│   ├── args.ts           # CLI argument parsing
│   ├── parser.ts         # Command string parsing
│   ├── path.ts           # Path utilities
│   └── validation.ts     # File validation utilities
├── types/
│   ├── index.ts          # Type exports
│   ├── commands.types.ts # Command-related types
│   └── fileSystem.types.ts # File system types
└── constants/
    └── index.ts          # App constants and messages
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start` | Start the File Manager CLI |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run test` | Run the test suite |

---

## License

This project is developed for educational purposes as part of the JavaScript Programming course at Tbilisi State University.
