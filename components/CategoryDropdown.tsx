import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { CATEGORIES } from '../constants/categories';

interface CategoryDropdownProps {
    value: string;
    onChange: (category: string) => void;
    placeholder?: string;
    className?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
    value,
    onChange,
    placeholder = "Select Category",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (category: string) => {
        onChange(category);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between bg-zinc-950/50 border rounded-lg px-4 py-3 text-left transition-all duration-200 ease-in-out focus:outline-none ${isOpen ? 'border-[#22C55E] ring-1 ring-[#22C55E] shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-zinc-700 hover:border-zinc-500'}`}
            >
                <span className={`font-medium truncate flex-1 ${value ? 'text-white' : 'text-zinc-400'}`}>
                    {value || placeholder}
                </span>
                <div className="flex-shrink-0 ml-2">
                    {isOpen ? (
                        <ChevronUpIcon className="w-4 h-4 text-zinc-500" />
                    ) : (
                        <ChevronDownIcon className="w-4 h-4 text-zinc-500" />
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950 border border-zinc-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 hide-scrollbar">
                    <div className="p-2 space-y-1">
                        {/* Placeholder/All option if needed, but for "Select Category" usually we just have options */}
                        {/* If this is used for filtering "All Assets", we might want an explicit option for that. 
                            The placeholder usually acts as the "Reset" or "All". 
                            I'll verify usage. If value is empty string, it shows placeholder.
                            In Marketplace, we might want "All Assets" as a selectable item.
                        */}

                        {/* Add "All Assets" or default option if checking against empty string logic in parent, 
                            but typically dropdowns list valid values. 
                            For Marketplace, "All Assets" corresponds to empty string.
                        */}
                        <button
                            onClick={() => handleSelect('')}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${value === '' ? 'text-green-500 font-bold bg-zinc-900' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
                        >
                            {placeholder === "All Categories" ? "All Assets" : "Select..."}
                        </button>

                        {CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => handleSelect(category)}
                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${value === category ? 'text-green-500 font-bold bg-zinc-900' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'}`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
