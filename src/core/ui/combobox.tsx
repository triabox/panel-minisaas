"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { Button } from "@/core/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/core/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/ui/popover";

export type ComboboxOption = {
  value: string;
  label: string;
  /** Descriptor opcional (ej: el área del taller, el código del motivo). */
  hint?: string;
  /** Valores adicionales sobre los que también queremos buscar. */
  searchValue?: string;
  disabled?: boolean;
};

type Props = {
  options: ComboboxOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Permite limpiar la selección. */
  clearable?: boolean;
  /** className del trigger. */
  className?: string;
  /** Se usa como id del trigger button para asociar con <Label>. */
  id?: string;
  ariaInvalid?: boolean;
};

/**
 * Select reemplazo con buscador integrado. Filtra localmente por la `label`
 * y por el `searchValue` opcional. Pensado para listas de catálogo (áreas,
 * talleres, sedes, motivos…) donde traemos todos los items pero queremos
 * que la usuaria pueda tipear para encontrar rápido.
 */
export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  emptyMessage = "Sin resultados.",
  searchPlaceholder = "Buscar...",
  disabled,
  clearable,
  className,
  id,
  ariaInvalid,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const seleccionada = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !seleccionada && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate text-left">
            {seleccionada ? seleccionada.label : placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(value, search) => {
            const opt = options.find((o) => o.value === value);
            if (!opt) return 0;
            const haystack = [opt.label, opt.hint ?? "", opt.searchValue ?? ""]
              .join(" ")
              .toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {clearable && value ? (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  Limpiar selección
                </CommandItem>
              ) : null}
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      value === opt.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{opt.label}</span>
                    {opt.hint ? (
                      <span className="truncate text-xs text-muted-foreground">
                        {opt.hint}
                      </span>
                    ) : null}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
