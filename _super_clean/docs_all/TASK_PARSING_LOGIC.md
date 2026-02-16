# Task Parsing System Logic - Complete List

## Text Normalization

- **Lowercase conversion** (`toLowerCase()`)
  - Applied to task text for pattern matching (`suggestFrequency`)
  - Applied to recurring type strings (`normalizeRecurringType`)
  - Applied to mode strings (`colorForMode`)
  - Applied to slug generation (`normalizeSlug`)

- **Whitespace normalization**
  - `replace(/\s+/g, '_')` - Convert spaces to underscores
  - `replace(/\s+/g, '')` - Remove all spaces (for slugs)
  - `trim()` - Remove leading/trailing whitespace
  - `split(',').map(x=>x.trim())` - Split and trim comma-separated values

- **Character replacement**
  - `replace(/-/g,'_')` - Convert hyphens to underscores
  - `replace(/\([^)]*\)/g, '')` - Remove parenthetical content
  - `replace(/^[-•]+\s*/, '')` - Remove bullet points

## Pattern Matching (Verbs/Keywords)

- **Frequency suggestion patterns** (`suggestFrequency`)
  - `/haircut|barber/` → "3w" (every 3 weeks)
  - `/dentist/` → "6m" (every 6 months)
  - `/oil change/` → "3m" (every 3 months)
  - `/bill|rent|mortgage|internet|electric|water|phone/` → "1m" (monthly)
  - `/mow/` → "1w" (weekly)

- **Mode/category detection** (`colorForMode`)
  - `includes('home')` → green color
  - `includes('business') || includes('work')` → blue color
  - `includes('church')` → purple color
  - `includes('personal')` → amber color
  - `includes('errand') || includes('shopping')` → red color

## Recurring Type Normalization

- **Input normalization** (`normalizeRecurringType`)
  - Convert to lowercase
  - Replace spaces with underscores
  - Replace hyphens with underscores

- **Synonym mapping**
  - 'off': ['off','one_time','one-time','none','once','never']
  - 'seasonal': ['seasonal', 'season']
  - 'as_needed': ['as_needed','asneeded','as_needed_basis']
  - '1w': ['weekly','every_week','week','1w']
  - '2w': ['biweekly','every_2_weeks','2w']
  - '1m': ['monthly','every_month','1m']
  - '2m': ['bimonthly','every_2_months','2m']
  - '3m': ['quarterly','every_3_months','3m']
  - '6m': ['semiannual','every_6_months','6m','semi_annual']
  - '12m': ['annual','yearly','every_12_months','12m']

## Date Parsing

- **ISO date normalization** (`iso()`)
  - Convert Date objects to ISO string format (YYYY-MM-DD)
  - Handle timezone offsets
  - Fallback to current date on error

- **Date string parsing**
  - `split('T')[0]` - Extract date portion from ISO datetime
  - `split('-').map(Number)` - Parse YYYY-MM-DD format
  - `toISOString().slice(0,10)` - Format to ISO date string

- **Day of week normalization**
  - Map numeric day (0-6) to canonical abbreviations: ['Su','M','Tu','W','Th','F','Sa']
  - Alias mapping:
    - 'Su': ['Su','Sun','Sunday','S']
    - 'M': ['M','Mon','Monday']
    - 'Tu': ['Tu','T','Tue','Tues','Tuesday']
    - 'W': ['W','Wed','Wednesday']
    - 'Th': ['Th','T','Thu','Thur','Thursday']
    - 'F': ['F','Fri','Friday']
    - 'Sa': ['Sa','Sat','Saturday','S']

## Time Parsing

- **Time string parsing**
  - `split(':').map(Number)` - Parse HH:MM format
  - `split(' ')` - Separate time and AM/PM
  - `toLowerCase()` - Normalize AM/PM to lowercase
  - Convert 12-hour to 24-hour format
  - Convert decimal hours to HH:MM format

- **Time slot normalization**
  - Parse comma-separated time strings
  - Validate time format (HH:MM)
  - Default to '08:00' if empty

## String Splitting & Tokenization

- **Comma-separated values**
  - `split(',').map(x=>x.trim()).filter(Boolean)` - Parse lists
  - Used for active days, categories, time slots

- **Newline splitting**
  - `split(/\r?\n/)` - Handle both Windows and Unix line endings
  - `map(s => s.trim()).filter(Boolean)` - Clean and filter empty lines

- **Space splitting**
  - `split(/\s+/)` - Split on whitespace
  - Used for parsing time strings with AM/PM

## Database Search Logic

- **Task search patterns**
  - Search by `mode` field (category)
  - Search by `task` field (name)
  - Search by `user_id` field
  - Filter by `mode === 'habit'` for habits

- **Template search**
  - Search by `name` field (case-insensitive)
  - Filter by `user_id` and `is_system === false`
  - Order by `name` ascending

## Task Normalization (Synonyms/Equivalents)

- **Task name normalization**
  - "Mow the lawn" → "cut the grass" (implied synonym matching)
  - Pattern-based matching using regex (`/mow/` matches "mow the lawn")
  - Case-insensitive matching

- **Slug normalization** (`normalizeSlug`)
  - Convert to lowercase
  - Remove all spaces
  - Remove parenthetical content
  - Used for channel/handle matching

## Transitional Words (Not explicitly implemented, but referenced)

- **Potential transitional words to detect**
  - "then" - Sequential task ordering
  - "after" - Dependency indication
  - "before" - Dependency indication
  - "and" - Task conjunction
  - "or" - Alternative tasks
  - "next" - Sequential ordering

## Array/List Normalization

- **Array validation**
  - `Array.isArray()` checks
  - Default to empty array `[]` if not array
  - `filter(Boolean)` - Remove falsy values

- **Set operations**
  - `new Set()` - Deduplication
  - `Array.from(new Set())` - Convert back to array

## Number Parsing

- **Integer parsing**
  - `parseInt(String(value), 10)` - Parse with radix
  - `Number(value)` - Type conversion
  - `Number.isFinite()` - Validation

- **Default values**
  - `|| 1` - Default to 1
  - `|| 30` - Default to 30 (days)
  - `|| '08:00'` - Default time

## Boolean Normalization

- **Truthy/falsy checks**
  - `!!value` - Convert to boolean
  - `value ? true : false` - Explicit conversion
  - `value || defaultValue` - Default value fallback

## Validation & Filtering

- **Empty string checks**
  - `String(value || '').trim().length > 0` - Non-empty validation
  - `filter(Boolean)` - Remove falsy values

- **Type coercion**
  - `String(value)` - Convert to string
  - `Array.isArray(value) ? value : []` - Ensure array
  - `typeof value === 'object' && value !== null` - Object validation
