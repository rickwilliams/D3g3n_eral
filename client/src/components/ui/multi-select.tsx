import * as React from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Badge } from './badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface Option {
  label: string;
  value: string;
  description?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
  allowUserInput?: boolean;
  disabled?: boolean;
}

export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  function MultiSelect(
    { 
      options, 
      selected, 
      onChange, 
      placeholder = 'Select items', 
      className, 
      emptyMessage = 'No items found.', 
      allowUserInput = false, 
      disabled = false 
    }, 
    ref
  ) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [selectedOptions, setSelectedOptions] = React.useState<Option[]>([]);
    
    // Update the selected options when the selected prop changes
    React.useEffect(() => {
      const newSelectedOptions = selected
        .map(value => options.find(option => option.value === value))
        .filter(Boolean) as Option[];
      
      setSelectedOptions(newSelectedOptions);
    }, [selected, options]);
    
    const handleUnselect = (value: string) => {
      onChange(selected.filter(item => item !== value));
    };
    
    const handleSelect = (value: string) => {
      if (selected.includes(value)) {
        handleUnselect(value);
      } else {
        onChange([...selected, value]);
      }
      setInputValue('');
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (allowUserInput && e.key === 'Enter' && inputValue.trim() !== '') {
        e.preventDefault();
        handleAddCustomValue();
      }
    };
    
    const handleAddCustomValue = () => {
      const value = inputValue.trim();
      if (value && !selected.includes(value)) {
        const newOption: Option = { label: value, value };
        const isDuplicate = options.some(option => 
          option.value.toLowerCase() === value.toLowerCase() || 
          option.label.toLowerCase() === value.toLowerCase()
        );
        
        if (!isDuplicate) {
          onChange([...selected, value]);
          setInputValue('');
          setOpen(false);
        }
      }
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div ref={ref} className={cn("w-full", className)}>
          <PopoverTrigger asChild>
            <div 
              className={cn(
                "min-h-10 flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                selectedOptions.length > 0 ? "p-1" : "px-3 py-2",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !disabled && setOpen(!open)}
            >
              <div className="flex flex-wrap gap-1 grow">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map(option => (
                    <Badge
                      key={option.value}
                      className="m-0.5 py-0.5 pl-2 pr-1 gap-1"
                      variant="secondary"
                    >
                      {option.label}
                      <button
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUnselect(option.value);
                          }
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleUnselect(option.value);
                        }}
                        disabled={disabled}
                        aria-label={`Remove ${option.label}`}
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
              </div>
            </div>
          </PopoverTrigger>

          <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
            <Command>
              <CommandInput 
                placeholder="Search..." 
                onValueChange={setInputValue}
                value={inputValue} 
                onKeyDown={handleKeyDown}
                disabled={disabled}
              />
              <CommandList>
                <CommandEmpty className="py-3 px-4 text-center text-sm">
                  {emptyMessage}
                  {allowUserInput && inputValue.trim() !== '' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={handleAddCustomValue}
                      disabled={disabled}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add &quot;{inputValue.trim()}&quot;
                    </Button>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {options.map(option => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={handleSelect}
                      disabled={disabled}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selected.includes(option.value) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </div>
      </Popover>
    );
  }
); 