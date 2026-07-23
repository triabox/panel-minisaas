"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

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
import type { ComboboxOption } from "@/core/ui/combobox";

type Props = {
  /** Función que ejecuta la búsqueda (server action o fetch). */
  search: (query: string) => Promise<ComboboxOption[]>;
  value: string | null | undefined;
  /** Etiqueta visible cuando hay un valor seleccionado pero no la option en la lista. */
  selectedLabel?: string | null;
  onChange: (value: string | null, option: ComboboxOption | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Mínimo de caracteres antes de pegarle al backend. Default 3. */
  minChars?: number;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  id?: string;
  ariaInvalid?: boolean;
};

export function AsyncCombobox({
  search,
  value,
  selectedLabel,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscá por nombre, apellido o DNI...",
  minChars = 3,
  disabled,
  clearable,
  className,
  id,
  ariaInvalid,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [opciones, setOpciones] = React.useState<ComboboxOption[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [labelLocal, setLabelLocal] = React.useState<string | null>(
    selectedLabel ?? null,
  );

  // Buscar al teclear, con debounce. Sólo dispara si hay suficientes chars.
  React.useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < minChars) return;
    let cancel = false;
    const t = setTimeout(() => {
      setCargando(true);
      search(trimmed)
        .then((res) => {
          if (!cancel) setOpciones(res);
        })
        .finally(() => {
          if (!cancel) setCargando(false);
        });
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [query, open, minChars, search]);

  const seleccionLabel = (() => {
    if (!value) return null;
    const enLista = opciones.find((o) => o.value === value);
    return enLista?.label ?? labelLocal ?? selectedLabel ?? null;
  })();

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
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate text-left">
            {seleccionLabel ?? placeholder}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {cargando ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Buscando...
              </div>
            ) : query.trim().length < minChars ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Escribí al menos {minChars} letras para buscar.
              </p>
            ) : opciones.length === 0 ? (
              <CommandEmpty>Sin resultados.</CommandEmpty>
            ) : null}

            {!cargando && opciones.length > 0 ? (
              <CommandGroup>
                {clearable && value ? (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onChange(null, null);
                      setLabelLocal(null);
                      setOpen(false);
                    }}
                    className="text-muted-foreground"
                  >
                    Limpiar selección
                  </CommandItem>
                ) : null}
                {opciones.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    onSelect={() => {
                      onChange(opt.value, opt);
                      setLabelLocal(opt.label);
                      setOpen(false);
                      setQuery("");
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
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
