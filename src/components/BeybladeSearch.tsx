import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchResult {
  name: string;
  url: string;
  slug: string;
}

interface BeybladeSearchProps {
  onSelect: (slug: string, name: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}

export function BeybladeSearch({ 
  onSelect, 
  onCancel,
  placeholder = "Digite o nome da Beyblade...",
  className 
}: BeybladeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      setIsSearching(true);
      console.log("Searching for:", query);
      try {
        const { data, error } = await supabase.functions.invoke("search-beyblade", {
          body: { query },
        });

        // Check if request was aborted
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        if (error) throw error;
        
        console.log("Search results:", data.results);
        setResults(data.results || []);
        setShowResults(true);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setQuery(result.name);
    setShowResults(false);
    onSelect(result.slug, result.name);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-6 text-xs"
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-[100] w-full mt-1 bg-card border border-border rounded-md shadow-xl max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.slug}-${index}`}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-primary/10 active:bg-primary/20 transition-colors text-sm border-b border-border/50 last:border-b-0"
              onMouseDown={(e) => {
                e.preventDefault();
                console.log("Selected result:", result);
                handleSelect(result);
              }}
            >
              <span className="font-medium">{result.name}</span>
            </button>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-4 text-center text-sm text-muted-foreground">
          Nenhuma Beyblade encontrada para "{query}"
        </div>
      )}
    </div>
  );
}
