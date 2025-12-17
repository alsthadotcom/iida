/**
 * jsonValidator.ts
 * 
 * Lightweight, strict JSON schema validator for V4.5 Epistemic Engine.
 * Enforces types, required fields, and basic constraints without external dependencies.
 */

export interface Schema {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'any';
    required?: boolean | string[]; // boolean for property requiredness in parent, string[] for object required keys
    enum?: (string | number)[];
    items?: Schema; // For arrays
    properties?: Record<string, Schema>; // For objects
    nullable?: boolean; // If true, allows null
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * Validates data against a strictly defined schema.
 */
export const validateSchema = (data: any, schema: Schema, path: string = 'root'): ValidationResult => {
    const errors: string[] = [];

    // 1. Check Type
    const dataType = getDataType(data);

    // Handle specific 'null' type check from schema
    if (schema.type === 'null') {
        if (data !== null) {
            errors.push(`${path}: Expected null, got ${dataType}`);
        }
        return { valid: errors.length === 0, errors };
    }

    // Handle nullable
    if (data === null) {
        if (schema.nullable) {
            return { valid: true, errors: [] };
        } else {
            errors.push(`${path}: Value is null but schema does not allow nullable`);
            return { valid: false, errors };
        }
    }

    if (schema.type !== 'any' && dataType !== schema.type) {
        // Special case: 'number' schema vs 'integer' (not handled, keeping simple)
        errors.push(`${path}: Expected ${schema.type}, got ${dataType}`);
        return { valid: false, errors }; // Stop further checks if type mismatch
    }

    // 2. Check Enums
    if (schema.enum && !schema.enum.includes(data)) {
        errors.push(`${path}: Value '${data}' is not in allowed enum: [${schema.enum.join(', ')}]`);
    }

    // 3. Check Object Properties
    if (schema.type === 'object' && schema.properties) {
        const requiredKeys = Array.isArray(schema.required) ? schema.required : [];

        // Check Required Keys (if defined as array on object)
        requiredKeys.forEach((key: string) => {
            if (data[key] === undefined) {
                errors.push(`${path}.${key}: Missing required field`);
            }
        });

        // Loop defined properties
        Object.keys(schema.properties!).forEach(key => {
            const propSchema = schema.properties![key];

            // Check Required (if defined as boolean on property)
            if (propSchema.required === true && data[key] === undefined) {
                // Check if it was already caught by parent required array check? 
                // We'll allow redundancy or preferably use one style.
                if (!requiredKeys.includes(key)) {
                    errors.push(`${path}.${key}: Missing required field`);
                }
            }

            if (data[key] !== undefined) {
                const result = validateSchema(data[key], propSchema, `${path}.${key}`);
                if (!result.valid) {
                    errors.push(...result.errors);
                }
            }
        });
    }

    // 4. Check Array Items
    if (schema.type === 'array' && schema.items && Array.isArray(data)) {
        data.forEach((item, index) => {
            const result = validateSchema(item, schema.items as Schema, `${path}[${index}]`);
            if (!result.valid) {
                errors.push(...result.errors);
            }
        });
    }

    return { valid: errors.length === 0, errors };
};

/**
 * Helper to get strictly typed string for JS objects.
 */
function getDataType(data: any): string {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    return typeof data;
}

/**
 * Clean & Parse JSON output from LLM.
 * Returns parsed object or throws error.
 */
export const cleanAndParseJson = (text: string): any => {
    try {
        if (!text) throw new Error("Empty input");

        // 1. Basic Markdown Block stripping
        let cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');

        // 2. Remove comments (careful not to remove URLs or text inside strings)
        // Simple comment removal can be dangerous if // is inside a string. 
        // For safety in this strict environment, we'll skip aggressive comment removal 
        // or safer: remove only if it looks like a line comment at start of line or after whitespace
        cleaned = cleaned.replace(/^\s*\/\/.*$/gm, '');

        const firstOpen = cleaned.indexOf('{');
        const lastClose = cleaned.lastIndexOf('}');

        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            cleaned = cleaned.substring(firstOpen, lastClose + 1);
        }

        // 3. SANITIZATION: Escape control characters ONLY inside string literals
        // Regex explanation:
        // "        Match opening quote
        // (        Capture group for content
        //   (?:    Non-capturing group for alternation
        //     \\.  Match escaped characters (like \")
        //     |    OR
        //     [^"\\] Match any non-quote, non-backslash
        //   )*     Repeat
        // )        End capture
        // "        Match closing quote
        cleaned = cleaned.replace(/"((?:\\.|[^"\\])*)"/g, (match, content) => {
            // Inside the string, escape newlines, returns, tabs
            const escaped = content
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');
            return `"${escaped}"`;
        });

        return JSON.parse(cleaned);
    } catch (e: any) {
        throw new Error(`JSON Parse Failed: ${e.message}`);
    }
};
