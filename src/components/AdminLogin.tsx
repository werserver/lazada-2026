import { useState } from "react";
import { verifyCredentials, loginAdmin } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, LogIn } from "lucide-react";

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCredentials(username.trim(), password)) {
      loginAdmin();
      onSuccess();
    } else {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">เข้าสู่ระบบ Admin</CardTitle>
          <p className="text-sm text-muted-foreground">กรุณากรอกชื่อผู้ใช้และรหัสผ่าน</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="ชื่อผู้ใช้"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full gap-2">
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบ
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
