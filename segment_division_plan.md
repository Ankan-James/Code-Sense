# CodeSense — Master Segmentation Prompt

## Purpose
This prompt is used by the CodeSense backend to instruct the Groq AI (LLaMA 3.3) to parse any non-Python code file into a recursive segment tree. The tree must follow the exact JSON shape defined below and match the language-specific rules defined for each supported language.

---

## The JSON Shape (always return this exact structure)

```json
[
  {
    "name": "segment name",
    "type": "segment type",
    "code": "the actual code of this segment",
    "children": [
      {
        "name": "child segment name",
        "type": "child segment type",
        "code": "the actual code of this child segment",
        "children": []
      }
    ]
  }
]
```

### Rules for the JSON shape
- Every segment must have exactly four keys: name, type, code, children
- children is always a list — empty list [] if the segment has no children
- children can contain more segments which can also have their own children — this is recursive and can go as deep as the code requires
- code must contain the actual source code of that segment, not a description
- name must be a short meaningful identifier — the function name, class name, or block label
- type must be one of the values defined in the language rules below
- Never return markdown, never return backticks, never return explanations — return only the raw JSON array

---

## Language Rules

### JavaScript
Top level segments in this order:
1. type: "imports" — all import and require statements grouped together, name: "Imports"
2. type: "constants" — all top level const, let, var declarations that are not functions, name: "Constants"
3. type: "class" — each class is its own segment, name: the class name
   - children: each method inside the class is a child segment, type: "method", name: the method name, children: []
4. type: "function" — each top level function or arrow function assigned to a variable, name: the function name
   - children: any nested functions inside, type: "function", name: the nested function name, children: []
5. type: "event_listener" — all addEventListener or DOMContentLoaded blocks, name: "Event Listeners"
6. type: "init" — the main init or entry call at the bottom of the file, name: "Init"

### TypeScript
Top level segments in this order:
1. type: "imports" — all import statements, name: "Imports"
2. type: "types" — all interface and type definitions grouped, name: "Types and Interfaces"
   - children: each individual interface or type is a child, type: "interface" or "type", name: the interface or type name, children: []
3. type: "enums" — all enum definitions, name: "Enums"
   - children: each enum is a child, type: "enum", name: the enum name, children: []
4. type: "constants" — all top level const declarations that are not functions, name: "Constants"
5. type: "class" — each class is its own segment, name: the class name
   - children: each method inside the class, type: "method", name: the method name, children: []
6. type: "function" — each top level function, name: the function name
   - children: any nested functions, type: "function", name: the nested function name, children: []
7. type: "event_listener" — all event listener blocks, name: "Event Listeners"
8. type: "init" — the main init or entry call, name: "Init"

### Java
Top level segments in this order:
1. type: "package" — the package declaration, name: "Package"
2. type: "imports" — all import statements grouped, name: "Imports"
3. type: "class" — the main class (everything in Java lives inside a class), name: the class name
   - children in this order:
     - type: "constants" — all static final fields, name: "Constants", children: []
     - type: "fields" — all instance fields, name: "Fields", children: []
     - type: "constructor" — the constructor method, name: the constructor name, children: []
     - type: "method" — each public method, name: the method name, children: []
     - type: "method" — each private method, name: the method name, children: []
     - type: "method" — each static method, name: the method name, children: []
     - type: "main" — the main() method if present, name: "main", children: []

### C#
Top level segments in this order:
1. type: "using" — all using directives grouped, name: "Using Directives"
2. type: "namespace" — the namespace block, name: the namespace name
   - children in this order:
     - type: "enum" — each enum definition, name: the enum name, children: []
     - type: "interface" — each interface definition, name: the interface name, children: []
     - type: "class" — each class definition, name: the class name
       - children in this order:
         - type: "constants" — all const fields, name: "Constants", children: []
         - type: "fields" — all instance fields, name: "Fields", children: []
         - type: "property" — each property with get/set, name: the property name
           - children: type: "getter" name: "get" children: [] and type: "setter" name: "set" children: [] if both exist
         - type: "constructor" — the constructor, name: the constructor name, children: []
         - type: "method" — each public method, name: the method name, children: []
         - type: "method" — each private method, name: the method name, children: []
         - type: "method" — each static method, name: the method name, children: []
         - type: "main" — the Main() entry point if present, name: "Main", children: []

### C
Top level segments in this order:
1. type: "preprocessor" — all #include and #define statements grouped, name: "Preprocessor"
   - children: each #include is a child type: "include" name: the header name children: []
   - children: each #define is a child type: "define" name: the macro name children: []
2. type: "typedef" — all struct and typedef definitions, name: "Type Definitions"
   - children: each struct or typedef is a child, type: "struct" or "typedef", name: the type name, children: []
3. type: "globals" — all global variable declarations, name: "Global Variables", children: []
4. type: "prototype" — all function prototypes grouped, name: "Function Prototypes", children: []
5. type: "function" — each function definition, name: the function name, children: []
6. type: "main" — the main() function, name: "main", children: []

### C++
Top level segments in this order:
1. type: "preprocessor" — all #include and using namespace statements, name: "Preprocessor"
   - children: each #include is a child type: "include" name: the header name children: []
   - children: using namespace is a child type: "namespace" name: the namespace name children: []
2. type: "constants" — all top level const and constexpr declarations, name: "Constants", children: []
3. type: "typedef" — all struct and typedef definitions, name: "Type Definitions"
   - children: each struct or typedef, type: "struct" or "typedef", name: the type name, children: []
4. type: "globals" — all global variable declarations, name: "Global Variables", children: []
5. type: "class" — each class definition, name: the class name
   - children in this order:
     - type: "private" — private section, name: "Private", children: []
     - type: "public" — public section, name: "Public"
       - children: constructor type: "constructor" name: the class name children: []
       - children: destructor type: "destructor" name: ~ClassName children: []
       - children: each method type: "method" name: the method name children: []
     - type: "method_def" — out of class method definitions ClassName::method(), name: the full method signature, children: []
6. type: "prototype" — all function prototypes, name: "Function Prototypes", children: []
7. type: "function" — each standalone function, name: the function name, children: []
8. type: "main" — the main() function, name: "main", children: []

### HTML
Top level segments in this order:
1. type: "doctype" — the DOCTYPE declaration, name: "DOCTYPE", children: []
2. type: "head" — the entire head element, name: "Head"
   - children: each meaningful child of head
     - type: "meta" — all meta tags grouped, name: "Meta Tags", children: []
     - type: "title" — the title tag, name: "Title", children: []
     - type: "stylesheet" — each link rel stylesheet, name: the href value, children: []
     - type: "script" — each script tag in head, name: the src value or "Inline Script", children: []
3. type: "body" — the entire body element, name: "Body"
   - children: each meaningful semantic child of body
     - type: "header" name: "Header"
       - children: type: "nav" name: "Nav" children: []
     - type: "main" name: "Main"
       - children: each section or article or meaningful div
         - type: "section" name: the id or class of the section
         - type: "article" name: the id or class of the article
     - type: "footer" name: "Footer", children: []
     - type: "script" — each script tag at bottom of body, name: the src value or "Inline Script", children: []

Rule for HTML: Stop drilling down at meaningful semantic tags. Do not go down to every span, a, p, or button. Stop at header, nav, main, section, article, aside, footer, and script.

### CSS
Top level segments — each rule block is a segment:
1. type: "reset" — the * {} rule if present, name: "Reset", children: []
2. type: "variables" — the :root {} block, name: "Variables", children: []
3. type: "base" — body, html base rules, name: "Base Styles", children: []
4. type: "component" — each class or id selector block, name: the selector name, children: []
5. type: "keyframes" — each @keyframes block, name: the animation name
   - children: type: "keyframe" name: "from" or "to" or the percentage, children: []
6. type: "media" — each @media block, name: the media query condition
   - children: each selector inside the media query, type: "component", name: the selector name, children: []

Rule for CSS: A segment has children if and only if its block contains other {} blocks inside it. Otherwise children is always [].

---

## The System Prompt (send this as the system message to Groq)

```
You are a code parser for the CodeSense application.
Your only job is to receive a code file and return a recursive JSON segment tree.
You must follow the exact language rules and JSON shape you have been given.
You must never return markdown, backticks, explanations, or any text outside the JSON array.
Your entire response must be a valid JSON array that can be parsed by JSON.parse() with no modifications.
If you are unsure about a segment, make your best judgment based on the rules.
Never skip segments. Never merge segments that should be separate.
Always include the actual source code in the code field, not a description.
```

---

## The User Prompt Template (send this as the user message to Groq)

```
Parse this {LANGUAGE} file into a recursive segment tree.
Follow the {LANGUAGE} rules exactly.
Return only a raw JSON array. No markdown. No backticks. No explanation. No text before or after the JSON.

File content:
{CODE}
```

Replace {LANGUAGE} with the detected language and {CODE} with the file content.

---

## Language Detection (by file extension)

| Extension | Language |
|-----------|----------|
| .py       | Python   |
| .js       | JavaScript |
| .ts       | TypeScript |
| .java     | Java     |
| .cs       | C#       |
| .c        | C        |
| .cpp      | C++      |
| .html     | HTML     |
| .css      | CSS      |

---

## Fallback Rule

If parsing fails for any reason, return this:

```json
[
  {
    "name": "Full File",
    "type": "full_code",
    "code": "the entire file content here",
    "children": []
  }
]
```

---

## Key Insight

Every language is different on the surface but the underlying idea is always the same — find the meaningful blocks of code, nest them correctly, and return a clean recursive tree. The frontend never needs to know which language it is. It just renders whatever tree the backend returns. Same rule, same UI, every language.
