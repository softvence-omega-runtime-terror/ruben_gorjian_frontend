"use client";

import * as React from "react";
import Image from "next/image";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type MultiSelectOption = {
  value: string;
  label: string;
  thumbnail?: string;
  badge?: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items...",
  emptyText = "No items found.",
  searchPlaceholder = "Search...",
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    console.log("[MultiSelect] handleSelect called with:", value);
    console.log("[MultiSelect] Available options:", options.map(o => o.value));
    console.log("[MultiSelect] Currently selected:", selected);
    
    // cmdk might lowercase or transform the value, so find the actual option
    const actualValue = options.find(
      (opt) => opt.value.toLowerCase() === value.toLowerCase()
    )?.value || value;
    
    console.log("[MultiSelect] Resolved actualValue:", actualValue);
    
    if (selected.includes(actualValue)) {
      const newSelected = selected.filter((item) => item !== actualValue);
      console.log("[MultiSelect] Removing, new selection:", newSelected);
      onChange(newSelected);
    } else {
      const newSelected = [...selected, actualValue];
      console.log("[MultiSelect] Adding, new selection:", newSelected);
      onChange(newSelected);
    }
  };

  const handleRemove = (value: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onChange(selected.filter((item) => item !== value));
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            selected.length > 0 && "h-auto min-h-10 py-2"
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-slate-400">{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="mr-1 bg-slate-700 text-slate-200"
                >
                  {option.thumbnail && (
                    <Image
                      src={option.thumbnail}
                      alt=""
                      width={16}
                      height={16}
                      className="w-4 h-4 rounded mr-1 object-cover"
                      unoptimized
                    />
                  )}
                  {option.label}
                  {option.badge && (
                    <span className="ml-1 text-xs text-slate-400">({option.badge})</span>
                  )}
                  <button
                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(option.value);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => handleRemove(option.value, e)}
                  >
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-200" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.thumbnail && (
                  <Image
                    src={option.thumbnail}
                    alt=""
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded mr-2 object-cover"
                    unoptimized
                  />
                )}
                <div className="flex-1">
                  {option.label}
                  {option.badge && (
                    <span className="ml-2 text-xs text-slate-400">({option.badge})</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
