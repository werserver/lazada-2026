import { Badge } from "@/components/ui/badge";

interface KeywordTagsProps {
  keywords: string[];
  onSelect: (keyword: string) => void;
  active?: string;
}

export function KeywordTags({ keywords, onSelect, active }: KeywordTagsProps) {
  if (!keywords.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={!active ? "default" : "outline"}
        className="cursor-pointer transition-colors"
        onClick={() => onSelect("")}
      >
        ทั้งหมด
      </Badge>
      {keywords.map((kw) => (
        <Badge
          key={kw}
          variant={active === kw ? "default" : "outline"}
          className="cursor-pointer transition-colors"
          onClick={() => onSelect(kw)}
        >
          {kw}
        </Badge>
      ))}
    </div>
  );
}
