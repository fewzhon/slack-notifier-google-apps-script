# CLI Tools Setup Instructions

## ✅ Configuration Files Created

I've created the following configuration files for you:

- `package.json` - Project dependencies and npm scripts
- `.prettierrc.json` - Prettier code formatting configuration
- `.stylelintrc.json` - Stylelint CSS linting configuration
- `.gitignore` - Git ignore rules

## 🚀 Installation Steps

### 1. Install Dependencies
Run this command in your project root:
```bash
npm install
```

This will install:
- **Prettier** - Code formatter
- **Stylelint** - CSS linter  
- **stylelint-config-standard** - Standard CSS linting rules

### 2. Use the Tools

#### Format All Files (Prettier)
```bash
npm run format:all
```
Formats all HTML and CSS files.

#### Lint CSS Files (Stylelint)
```bash
npm run lint:css
```
Checks your CSS files for issues.

#### Format Only CSS
```bash
npm run format:css
```

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dev dependencies |
| `npm run lint:css` | Lint CSS files for errors |
| `npm run format:css` | Format CSS/HTML files |
| `npm run lint:all` | Run all linters |
| `npm run format:all` | Format all files |

## 🎨 Prettier Configuration

Your Prettier config includes:
- Single quotes for strings
- 2-space indentation
- Semi-colons enabled
- 100 character line width

## 🔍 Stylelint Configuration

Your Stylelint config includes:
- Standard CSS rules
- Single quotes for strings
- Allows custom property patterns (like `--auth-*`)

## 💡 Usage Tips

### VS Code Integration
If you have VS Code with Prettier extension:
- Files will auto-format on save
- Stylelint will show errors in the Problems panel

### Manual Formatting
```bash
# Format specific file
npx prettier --write src/presentation/web/login.html

# Check a file without changing it
npx prettier --check src/presentation/web/login.html

# Lint specific file
npx stylelint src/presentation/web/assets/css/auth-styles.html
```

## 🎯 Next Steps

1. Run `npm install` to install the tools
2. Run `npm run format:all` to format all files
3. Run `npm run lint:css` to check for issues
4. Integrate with your development workflow

## 📝 CI/CD Integration

You can add these to your CI pipeline:
```bash
# In your CI script
npm ci
npm run lint:all  # Check for issues without fixing
npm run format:all -- --check  # Check formatting without changing files
```

