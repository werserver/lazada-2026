import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { AdminLogin } from "@/components/AdminLogin";
import { isAdminLoggedIn, logoutAdmin } from "@/lib/auth";
import { getAdminSettings, saveAdminSettings, saveCsvData, type AdminSettings } from "@/lib/store";
import { clearCsvCache } from "@/lib/csv-products";
import { refreshSitemapCache, parseAndCacheXml } from "@/lib/sitemap-parser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save, LogOut, Settings, BarChart3, Key, Upload, FileSpreadsheet, 
  Database, Globe, Map as MapIcon, Type, Plus, Trash2, RefreshCw, FileCode
} from "lucide-react";
import { toast } from "sonner";

export default function AdminPanel() {
  const [authed, setAuthed] = useState(isAdminLoggedIn);

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead title="Admin Panel - Lazada 2026" description="จัดการระบบและดูสถิติ" />
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Settings className="h-8 w-8" />
              แผงควบคุมผู้ดูแลระบบ
            </h1>
            <p className="text-muted-foreground">จัดการการตั้งค่าเว็บไซต์และแหล่งข้อมูลสินค้า</p>
          </div>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => { logoutAdmin(); setAuthed(false); }}
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-background border">
            <TabsTrigger value="settings" className="py-2.5 gap-2">
              <Settings className="h-4 w-4" /> ตั้งค่าระบบ
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="py-2.5 gap-2">
              <BarChart3 className="h-4 w-4" /> Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <SettingsTab />
          </TabsContent>
          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>สถิติการเข้าชมและการคลิก (กำลังพัฒนา)</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 opacity-20 mr-4" />
                ข้อมูลสถิติจะแสดงผลที่นี่ในเวอร์ชันถัดไป
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings);
  const [newPrefix, setNewPrefix] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const sitemapFileInputRef = useRef<HTMLInputElement>(null);

  const update = (partial: Partial<AdminSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      saveAdminSettings(settings);
      clearCsvCache();
      
      if (settings.dataSource === "sitemap" && settings.sitemapUrl) {
        setIsRefreshing(true);
        await refreshSitemapCache(settings.sitemapUrl);
        toast.success("บันทึกและอัปเดต Sitemap เรียบร้อย!");
      } else {
        toast.success("บันทึกการตั้งค่าเรียบร้อย!");
      }
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
      setIsRefreshing(false);
    }
  };

  const handleSitemapUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const xmlText = event.target?.result as string;
      try {
        setIsRefreshing(true);
        await parseAndCacheXml(xmlText, `file:${file.name}`);
        toast.success(`อัปโหลดและประมวลผลไฟล์ ${file.name} สำเร็จ!`);
        update({ dataSource: "sitemap" });
      } catch (error: any) {
        toast.error(error.message || "ไฟล์ XML ไม่ถูกต้อง");
      } finally {
        setIsRefreshing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      saveCsvData(text);
      clearCsvCache();
      update({ csvFileName: file.name, dataSource: "csv" });
      toast.success(`อัปโหลดไฟล์ ${file.name} เรียบร้อย!`);
    };
    reader.readAsText(file);
  };

  const addPrefix = () => {
    const p = newPrefix.trim();
    if (!p || settings.prefixWords.includes(p)) return;
    update({ prefixWords: [...settings.prefixWords, p] });
    setNewPrefix("");
  };

  const removePrefix = (p: string) => {
    update({ prefixWords: settings.prefixWords.filter((x) => x !== p) });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2 bg-background p-4 rounded-xl border shadow-sm sticky top-4 z-10">
        <Button variant="outline" onClick={() => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
          const link = document.createElement('a');
          link.setAttribute("href", dataStr);
          link.setAttribute("download", "site-config.json");
          link.click();
        }} className="gap-2">
          <Upload className="h-4 w-4 rotate-180" /> Export
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-accent hover:bg-accent/90">
          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          บันทึกการตั้งค่าทั้งหมด
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> ข้อมูลเว็บไซต์
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>ชื่อเว็บไซต์</Label>
            <Input value={settings.siteName} onChange={(e) => update({ siteName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>URL ไอคอนเว็บ (Favicon)</Label>
            <Input value={settings.faviconUrl} onChange={(e) => update({ faviconUrl: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> แหล่งข้อมูลสินค้า
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {["api", "csv", "sitemap"].map((type) => (
              <Button
                key={type}
                variant={settings.dataSource === type ? "default" : "outline"}
                onClick={() => update({ dataSource: type as any })}
                className="capitalize gap-2"
              >
                {type === "api" && <Database className="h-4 w-4" />}
                {type === "csv" && <FileSpreadsheet className="h-4 w-4" />}
                {type === "sitemap" && <MapIcon className="h-4 w-4" />}
                {type}
              </Button>
            ))}
          </div>

          {settings.dataSource === "sitemap" && (
            <div className="space-y-4 p-4 bg-background rounded-xl border border-dashed">
              <div className="space-y-2">
                <Label>Sitemap URL (XML)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={settings.sitemapUrl} 
                    onChange={(e) => update({ sitemapUrl: e.target.value })}
                    placeholder="https://www.lazada.co.th/sitemap.xml"
                  />
                  <Button variant="secondary" onClick={handleSave} disabled={isRefreshing}>
                    {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">หรืออัปโหลดไฟล์</span></div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><FileCode className="h-4 w-4" /> อัปโหลดไฟล์ Sitemap (XML)</Label>
                <Input type="file" accept=".xml" onChange={handleSitemapUpload} className="cursor-pointer" />
              </div>
            </div>
          )}

          {settings.dataSource === "csv" && (
            <div className="p-4 bg-background rounded-xl border border-dashed space-y-2">
              <Label>อัปโหลดไฟล์ CSV</Label>
              <Input type="file" accept=".csv" onChange={handleCsvUpload} />
              {settings.csvFileName && <p className="text-xs text-muted-foreground">ไฟล์ปัจจุบัน: {settings.csvFileName}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" /> ระบบ URL Cloaking
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input value={settings.cloakingBaseUrl} onChange={(e) => update({ cloakingBaseUrl: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Affiliate Token</Label>
            <Input value={settings.cloakingToken} onChange={(e) => update({ cloakingToken: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" /> คำนำหน้าชื่อสินค้า (Prefix)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
            <Label>เปิดใช้งานคำนำหน้า</Label>
            <Switch checked={settings.enablePrefixWords} onCheckedChange={(v) => update({ enablePrefixWords: v })} />
          </div>
          {settings.enablePrefixWords && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input value={newPrefix} onChange={(e) => setNewPrefix(e.target.value)} placeholder="เพิ่มคำนำหน้า..." onKeyDown={(e) => e.key === 'Enter' && addPrefix()} />
                <Button onClick={addPrefix} size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.prefixWords.map((p, i) => (
                  <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
                    {p} <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:text-destructive" onClick={() => removePrefix(p)}><Trash2 className="h-3 w-3" /></Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
