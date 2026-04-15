"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getBanners, createBanner, updateBanner, deleteBanner } from "@/lib/pocketbase-db";
import { CarouselBanner } from "@/types";
import { Trash2, Eye, EyeOff, Plus, Link as LinkIcon, Image as ImageIcon, Upload, X } from "lucide-react";

export default function BannerManagementPage() {
    const [banners, setBanners] = useState<CarouselBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const data = await getBanners();
            setBanners(data);
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            setLoading(false);
        }
    };

    const convertToDirectLink = (url: string) => {
        if (!url) return "";

        // Handle Google Drive sharing links
        const driveIdMatch = url.match(/\/d\/(.+?)\/(view|edit)?/);
        if (driveIdMatch && driveIdMatch[1]) {
            return `https://drive.google.com/uc?export=view&id=${driveIdMatch[1]}`;
        }

        // Handle direct view links
        if (url.includes('drive.google.com/uc?id=')) {
            return url;
        }

        return url;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/admin/banners/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            const data = await response.json();
            setImageUrl(data.url);
            alert('Image uploaded successfully!');
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert(error.message || 'Failed to upload image. Make sure the banners bucket exists in Appwrite.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClearImage = () => {
        setImageUrl("");
    };

    const handleCreateBanner = async () => {
        if (!title || !imageUrl) {
            alert("Please provide at least a title and image URL.");
            return;
        }

        setIsSubmitting(true);
        try {
            const finalImageUrl = convertToDirectLink(imageUrl);
            await createBanner({
                title,
                imageUrl: finalImageUrl,
                linkUrl: linkUrl || undefined,
                isActive: true,
                order: banners.length,
                createdAt: Math.floor(Date.now() / 1000)
            });

            setTitle("");
            setImageUrl("");
            setLinkUrl("");
            fetchBanners();
            alert("Banner created successfully!");
        } catch (error) {
            console.error("Error creating banner:", error);
            alert("Failed to create banner.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (banner: CarouselBanner) => {
        try {
            await updateBanner(banner.id!, { isActive: !banner.isActive });
            fetchBanners();
        } catch (error) {
            console.error("Error updating banner:", error);
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;
        try {
            await deleteBanner(id);
            fetchBanners();
        } catch (error) {
            console.error("Error deleting banner:", error);
        }
    };

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "4rem" }}>
            <h1 style={{ marginBottom: "2rem" }}>Banner Management</h1>

            <Card style={{ marginBottom: "3rem" }}>
                <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Plus size={20} /> Add New Promotional Banner
                </h3>
                <div style={{ display: "grid", gap: "1.5rem" }}>
                    <Input
                        label="Banner Title (Internal reference)"
                        placeholder="e.g. Special Holi Offer"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <div>
                        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                            <Button
                                type="button"
                                onClick={() => setUploadMode("url")}
                                style={{
                                    padding: "0.5rem 1rem",
                                    background: uploadMode === "url" ? "var(--primary)" : "var(--surface)",
                                    color: uploadMode === "url" ? "white" : "var(--text-primary)",
                                    border: "1px solid var(--border)"
                                }}
                            >
                                <LinkIcon size={14} style={{ marginRight: "0.25rem" }} />
                                Google Drive URL
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setUploadMode("file")}
                                style={{
                                    padding: "0.5rem 1rem",
                                    background: uploadMode === "file" ? "var(--primary)" : "var(--surface)",
                                    color: uploadMode === "file" ? "white" : "var(--text-primary)",
                                    border: "1px solid var(--border)"
                                }}
                            >
                                <Upload size={14} style={{ marginRight: "0.25rem" }} />
                                Upload File
                            </Button>
                        </div>

                        {uploadMode === "url" ? (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "end" }}>
                                <Input
                                    label="Google Drive Link (Sharing URL)"
                                    placeholder="https://drive.google.com/file/d/..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                                {imageUrl && (
                                    <div style={{ marginBottom: "0.5rem" }}>
                                        <img
                                            src={convertToDirectLink(imageUrl)}
                                            alt="Preview"
                                            style={{ width: "100px", height: "40px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border)" }}
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    style={{ display: "none" }}
                                    id="banner-file-upload"
                                />
                                <label htmlFor="banner-file-upload">
                                    <div
                                        style={{
                                            border: "2px dashed var(--border)",
                                            borderRadius: "8px",
                                            padding: "2rem",
                                            textAlign: "center",
                                            cursor: "pointer",
                                            background: "var(--surface)",
                                            transition: "border-color 0.2s"
                                        }}
                                    >
                                        {isUploading ? (
                                            <p>Uploading...</p>
                                        ) : imageUrl ? (
                                            <div style={{ position: "relative", display: "inline-block" }}>
                                                <img
                                                    src={imageUrl}
                                                    alt="Preview"
                                                    style={{ maxWidth: "200px", maxHeight: "100px", borderRadius: "4px", border: "1px solid var(--border)" }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.preventDefault(); handleClearImage(); }}
                                                    style={{
                                                        position: "absolute",
                                                        top: "-8px",
                                                        right: "-8px",
                                                        background: "red",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "50%",
                                                        width: "20px",
                                                        height: "20px",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload size={32} style={{ color: "var(--text-secondary)", marginBottom: "0.5rem" }} />
                                                <p style={{ color: "var(--text-secondary)" }}>Click to upload an image</p>
                                                <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>PNG, JPG, GIF up to 10MB</p>
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Destination Link (Optional)"
                        placeholder="/dashboard/tests or external URL"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                    />

                    <Button
                        onClick={handleCreateBanner}
                        style={{ marginTop: "0.5rem" }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Uploading..." : "Publish Banner"}
                    </Button>
                </div>
            </Card>

            <h2 style={{ marginBottom: "1.5rem" }}>Live Banners Carousel</h2>
            <div style={{ display: "grid", gap: "1.5rem" }}>
                {loading ? (
                    <p style={{ color: "var(--text-secondary)" }}>Loading banners...</p>
                ) : banners.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)", border: "2px dashed var(--border)", borderRadius: "12px" }}>
                        No banners configured. Add one above to show it in the dashboard.
                    </p>
                ) : (
                    banners.sort((a, b) => a.order - b.order).map((banner) => (
                        <Card key={banner.id} style={{ opacity: banner.isActive ? 1 : 0.6 }}>
                            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                                <div style={{ width: "200px", height: "80px", borderRadius: "8px", overflow: "hidden", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <img
                                        src={banner.imageUrl}
                                        alt={banner.title}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>{banner.title}</h4>
                                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                        <LinkIcon size={12} /> {banner.linkUrl || "No destination link"}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <Button
                                        onClick={() => handleToggleActive(banner)}
                                        style={{
                                            padding: "0.5rem",
                                            background: banner.isActive ? "rgba(74, 222, 128, 0.1)" : "rgba(255, 255, 255, 0.05)",
                                            color: banner.isActive ? "#4ade80" : "var(--text-secondary)",
                                            border: "none"
                                        }}
                                        title={banner.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {banner.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteBanner(banner.id!)}
                                        style={{
                                            padding: "0.5rem",
                                            background: "rgba(244, 114, 182, 0.1)",
                                            color: "#f472b6",
                                            border: "none"
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "rgba(139, 92, 246, 0.05)", borderRadius: "12px", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", display: "flex", gap: "0.5rem" }}>
                    <ImageIcon size={16} style={{ color: "var(--primary)" }} />
                    <span><strong>Pro Tip:</strong> Banners on the student dashboard use a 3:1 aspect ratio. For best results, use images that are roughly 1200x400 pixels.</span>
                </p>
            </div>
        </div>
    );
}
