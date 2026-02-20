import { Facebook, Link2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareToLine = () => {
    window.open(
      `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedTitle}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "คัดลอกลิงก์แล้ว!", description: "สามารถวางลิงก์เพื่อแชร์ได้เลย" });
    } catch {
      toast({ title: "ไม่สามารถคัดลอกได้", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-medium">แชร์:</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full border-[#06C755] text-[#06C755] hover:bg-[#06C755] hover:text-white"
        onClick={shareToLine}
        title="แชร์ผ่าน LINE"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full border-[#1877F2] text-[#1877F2] hover:bg-[#1877F2] hover:text-white"
        onClick={shareToFacebook}
        title="แชร์ผ่าน Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full"
        onClick={copyLink}
        title="คัดลอกลิงก์"
      >
        <Link2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
