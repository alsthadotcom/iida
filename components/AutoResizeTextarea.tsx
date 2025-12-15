import React, { useEffect, useRef } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}

export const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({ className, value, onChange, rows = 1, style, ...props }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = () => {
        const element = textareaRef.current;
        if (element) {
            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            {...props}
            ref={textareaRef}
            value={value}
            onChange={(e) => {
                adjustHeight(); // Resize immediately on input
                if (onChange) onChange(e);
            }}
            rows={rows}
            className={`${className} resize-none overflow-hidden`}
            style={style}
        />
    );
};
