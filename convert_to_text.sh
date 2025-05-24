#!/bin/bash

# React Project to ChatGPT-Optimized Text Converter
# Optimized for AI analysis and code review
# Usage: ./convert_react_to_chatgpt.sh [project_directory] [output_file]

PROJECT_DIR=${1:-.}
# Get the project directory name and append .txt for default output filename
PROJECT_NAME=$(basename "$(realpath "$PROJECT_DIR")")
OUTPUT_FILE=${2:-"${PROJECT_NAME}.txt"}

# Create or clear the output file
> "$OUTPUT_FILE"

echo "Converting React project to ChatGPT-optimized format..."
echo "Project Directory: $PROJECT_DIR"
echo "Output File: $OUTPUT_FILE"
echo ""

# Function to check if file should be included
should_include_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    # Skip files that aren't useful for AI analysis
    case "$filename" in
        node_modules|.git|.next|build|dist|coverage|.DS_Store|*.log|*.lock|package-lock.json|yarn.lock|*.min.js|*.min.css)
            return 1
            ;;
        .env*|*.key|*.pem|*.p12)
            return 1
            ;;
        *.jpg|*.jpeg|*.png|*.gif|*.svg|*.ico|*.woff|*.woff2|*.ttf|*.eot)
            return 1
            ;;
    esac
    
    # Include files important for code analysis
    case "$filename" in
        *.js|*.jsx|*.ts|*.tsx|*.json|*.md|*.css|*.scss|*.less|*.html|*.yml|*.yaml)
            return 0
            ;;
        package.json|tsconfig.json|tailwind.config.*|next.config.*|vite.config.*|webpack.config.*|*.config.js|*.config.ts)
            return 0
            ;;
        .eslintrc*|.prettierrc*|.babelrc*|jest.config.*|vitest.config.*)
            return 0
            ;;
        Dockerfile|docker-compose.*|.gitignore|README*)
            return 0
            ;;
    esac
    
    return 1
}

# Function to get file category for better organization
get_file_category() {
    local file="$1"
    local filename=$(basename "$file")
    local extension="${filename##*.}"
    
    case "$filename" in
        package.json|package-lock.json|yarn.lock) echo "PACKAGE_CONFIG" ;;
        tsconfig.json|jsconfig.json) echo "TYPESCRIPT_CONFIG" ;;
        *.config.js|*.config.ts|webpack.config.*|vite.config.*|next.config.*) echo "BUILD_CONFIG" ;;
        .eslintrc*|.prettierrc*|.babelrc*) echo "LINTING_CONFIG" ;;
        tailwind.config.*) echo "STYLING_CONFIG" ;;
        jest.config.*|vitest.config.*|*.test.*|*.spec.*) echo "TESTING" ;;
        README*|*.md) echo "DOCUMENTATION" ;;
        Dockerfile|docker-compose.*|.gitignore) echo "DEVOPS" ;;
        *.css|*.scss|*.less) echo "STYLES" ;;
        *.jsx|*.tsx) echo "REACT_COMPONENTS" ;;
        *.js|*.ts) echo "JAVASCRIPT" ;;
        *.html) echo "HTML" ;;
        *.json) echo "JSON_DATA" ;;
        *) echo "OTHER" ;;
    esac
}

# Function to process directory recursively and collect files by category
declare -A files_by_category
collect_files() {
    local dir="$1"
    local relative_path="$2"
    
    for item in "$dir"/*; do
        if [ ! -e "$item" ]; then
            continue
        fi
        
        local item_name=$(basename "$item")
        local item_relative_path="$relative_path/$item_name"
        
        if [ -d "$item" ]; then
            # Skip excluded directories
            case "$item_name" in
                node_modules|.git|.next|build|dist|coverage|public/static)
                    continue
                    ;;
            esac
            
            collect_files "$item" "$item_relative_path"
        elif [ -f "$item" ] && should_include_file "$item"; then
            local category=$(get_file_category "$item")
            files_by_category["$category"]+="$item_relative_path|$item "
        fi
    done
}

# Function to output files in a category
output_category() {
    local category="$1"
    local files="${files_by_category[$category]}"
    
    if [ -z "$files" ]; then
        return
    fi
    
    echo "## $category" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # Convert space-separated list to array
    IFS=' ' read -ra file_array <<< "$files"
    
    for file_info in "${file_array[@]}"; do
        if [ -z "$file_info" ]; then
            continue
        fi
        
        IFS='|' read -ra parts <<< "$file_info"
        local relative_path="${parts[0]}"
        local full_path="${parts[1]}"
        
        echo "\`\`\`${relative_path}" >> "$OUTPUT_FILE"
        
        # Add file content with error handling
        if [ -f "$full_path" ]; then
            # Check file size (skip very large files)
            local file_size=$(wc -c < "$full_path" 2>/dev/null || echo 0)
            if [ "$file_size" -gt 100000 ]; then
                echo "// File too large for analysis (${file_size} bytes)" >> "$OUTPUT_FILE"
                echo "// Showing first 50 lines only:" >> "$OUTPUT_FILE"
                head -50 "$full_path" >> "$OUTPUT_FILE"
                echo "" >> "$OUTPUT_FILE"
                echo "// ... (truncated)" >> "$OUTPUT_FILE"
            else
                cat "$full_path" >> "$OUTPUT_FILE"
            fi
        else
            echo "// File not found: $full_path" >> "$OUTPUT_FILE"
        fi
        
        echo "\`\`\`" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    done
}

# Start collection
collect_files "$PROJECT_DIR" ""

# Generate ChatGPT-optimized output
{
    echo "# React Project Code Analysis"
    echo ""
    echo "**Project:** $(basename "$(realpath "$PROJECT_DIR")")"
    echo "**Generated:** $(date)"
    echo "**Purpose:** Code review, analysis, and optimization suggestions"
    echo ""
    echo "---"
    echo ""
    echo "## Project Overview"
    echo ""
    echo "This is a complete React project export optimized for AI analysis. The code is organized by file type for easier review and understanding."
    echo ""
    
    # Count files by category
    echo "### File Summary"
    for category in "${!files_by_category[@]}"; do
        local count=$(echo "${files_by_category[$category]}" | wc -w)
        echo "- **$category**: $count files"
    done
    echo ""
    echo "---"
    echo ""
} >> "$OUTPUT_FILE"

# Output files in logical order for ChatGPT analysis
categories_order=(
    "PACKAGE_CONFIG"
    "TYPESCRIPT_CONFIG" 
    "BUILD_CONFIG"
    "LINTING_CONFIG"
    "STYLING_CONFIG"
    "DOCUMENTATION"
    "REACT_COMPONENTS"
    "JAVASCRIPT"
    "STYLES"
    "TESTING"
    "JSON_DATA"
    "HTML"
    "DEVOPS"
    "OTHER"
)

for category in "${categories_order[@]}"; do
    output_category "$category"
done

# Add analysis prompts for ChatGPT
{
    echo "---"
    echo ""
    echo "## Suggested Analysis Prompts"
    echo ""
    echo "You can ask ChatGPT to:"
    echo ""
    echo "### Code Quality & Best Practices"
    echo "- \"Review this React project for code quality, best practices, and potential improvements\""
    echo "- \"Identify any anti-patterns, security issues, or performance concerns\""
    echo "- \"Suggest modern React patterns and hooks optimizations\""
    echo ""
    echo "### Architecture & Structure"
    echo "- \"Analyze the project architecture and suggest improvements\""
    echo "- \"Review the component structure and recommend better organization\""
    echo "- \"Identify opportunities for code reusability and modularity\""
    echo ""
    echo "### Performance & Optimization"
    echo "- \"Identify performance bottlenecks and optimization opportunities\""
    echo "- \"Review bundle size and suggest ways to reduce it\""
    echo "- \"Analyze loading strategies and suggest improvements\""
    echo ""
    echo "### Testing & Maintenance"
    echo "- \"Assess test coverage and suggest testing improvements\""
    echo "- \"Identify areas that need better error handling\""
    echo "- \"Review accessibility compliance and suggest improvements\""
    echo ""
    echo "### Dependencies & Security"
    echo "- \"Review dependencies for security vulnerabilities and updates\""
    echo "- \"Suggest alternative libraries or tools\""
    echo "- \"Identify unused dependencies\""
    echo ""
} >> "$OUTPUT_FILE"

# Final statistics
total_files=0
for category in "${!files_by_category[@]}"; do
    count=$(echo "${files_by_category[$category]}" | wc -w)
    total_files=$((total_files + count))
done

echo ""
echo "✅ Conversion completed!"
echo "📁 Total files processed: $total_files"
echo "📄 Output saved to: $OUTPUT_FILE"
echo "📊 File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""
echo "🚀 Ready for ChatGPT analysis!"
echo ""
echo "💡 Tips:"
echo "   • Copy the entire content to ChatGPT for comprehensive analysis"
echo "   • Use the suggested prompts at the end of the file"
echo "   • Ask specific questions about particular components or patterns"