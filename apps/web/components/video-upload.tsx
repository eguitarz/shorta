"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface VideoUploadProps {
    onUploadComplete: (fileUri: string, fileName: string) => void;
    onError?: (error: string) => void;
    disabled?: boolean;
}

// Maximum duration: 3 minutes
const MAX_DURATION_SECONDS = 180;
// Maximum file size: 500MB
const MAX_FILE_SIZE_MB = 500;

const SUPPORTED_FORMATS = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

export function VideoUpload({ onUploadComplete, onError, disabled }: VideoUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [uploadComplete, setUploadComplete] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleError = useCallback((message: string) => {
        setError(message);
        onError?.(message);
    }, [onError]);

    const validateFile = useCallback(async (file: File): Promise<{ valid: boolean; duration?: number }> => {
        // Check file type
        if (!SUPPORTED_FORMATS.includes(file.type)) {
            handleError(`Unsupported format. Please use MP4, WebM, MOV, or AVI.`);
            return { valid: false };
        }

        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > MAX_FILE_SIZE_MB) {
            handleError(`File too large (${sizeMB.toFixed(1)}MB). Maximum is ${MAX_FILE_SIZE_MB}MB.`);
            return { valid: false };
        }

        // Try to check video duration (client-side)
        // If browser can't read the video, proceed anyway - server will validate
        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.preload = "metadata";

            // Timeout after 10 seconds - some videos take time to load metadata
            const timeout = setTimeout(() => {
                console.log('[VideoUpload] Video metadata load timeout - proceeding without duration check');
                URL.revokeObjectURL(video.src);
                resolve({ valid: true }); // Proceed without duration, server will check
            }, 10000);

            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                URL.revokeObjectURL(video.src);
                console.log('[VideoUpload] Video duration:', video.duration);
                if (video.duration > MAX_DURATION_SECONDS) {
                    const mins = Math.floor(video.duration / 60);
                    const secs = Math.floor(video.duration % 60);
                    handleError(`Video too long (${mins}:${secs.toString().padStart(2, '0')}). Maximum is 3 minutes.`);
                    resolve({ valid: false });
                } else {
                    resolve({ valid: true, duration: video.duration });
                }
            };

            video.onerror = () => {
                clearTimeout(timeout);
                URL.revokeObjectURL(video.src);
                console.log('[VideoUpload] Browser cannot read video - proceeding with upload, server will validate');
                // Don't block upload - some video formats work on server but not in browser preview
                resolve({ valid: true });
            };

            video.src = URL.createObjectURL(file);
        });
    }, [handleError]);

    const uploadFile = useCallback(async (file: File, duration?: number) => {
        console.log('[VideoUpload] uploadFile called', { fileName: file.name, duration });
        setUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);
            if (duration !== undefined) {
                formData.append("duration", duration.toString());
            }

            // Simulate progress (actual XHR would give real progress)
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => Math.min(prev + 10, 90));
            }, 500);

            console.log('[VideoUpload] sending POST to /api/upload-video');
            const response = await fetch("/api/upload-video", {
                method: "POST",
                body: formData,
            });

            clearInterval(progressInterval);
            console.log('[VideoUpload] response status:', response.status);

            if (!response.ok) {
                const data = await response.json();
                console.log('[VideoUpload] error response:', data);
                throw new Error(data.details || data.error || "Upload failed");
            }

            const data = await response.json();
            console.log('[VideoUpload] success:', data);
            setUploadProgress(100);
            setUploadComplete(true);
            onUploadComplete(data.fileUri, data.fileName);
        } catch (err) {
            console.error('[VideoUpload] upload error:', err);
            handleError(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    }, [onUploadComplete, handleError]);

    const handleFile = useCallback(async (selectedFile: File) => {
        console.log('[VideoUpload] handleFile called', { name: selectedFile.name, type: selectedFile.type, size: selectedFile.size });
        setError(null);
        setUploadComplete(false);
        setFile(selectedFile);

        const validation = await validateFile(selectedFile);
        console.log('[VideoUpload] validation result:', validation);
        if (validation.valid) {
            await uploadFile(selectedFile, validation.duration);
        } else {
            setFile(null);
        }
    }, [validateFile, uploadFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[VideoUpload] dragOver event', { disabled, uploading });
        if (!disabled && !uploading) {
            setIsDragging(true);
        }
    }, [disabled, uploading]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[VideoUpload] dragLeave event');
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[VideoUpload] drop event', { disabled, uploading, filesCount: e.dataTransfer.files.length });
        setIsDragging(false);

        if (disabled || uploading) {
            console.log('[VideoUpload] drop ignored - disabled or uploading');
            return;
        }

        const droppedFile = e.dataTransfer.files[0];
        console.log('[VideoUpload] dropped file:', droppedFile?.name, droppedFile?.type, droppedFile?.size);
        if (droppedFile) {
            handleFile(droppedFile);
        }
    }, [disabled, uploading, handleFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFile(selectedFile);
        }
    }, [handleFile]);

    const handleClick = useCallback(() => {
        if (!disabled && !uploading) {
            fileInputRef.current?.click();
        }
    }, [disabled, uploading]);

    const handleRemove = useCallback(() => {
        setFile(null);
        setError(null);
        setUploadComplete(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || uploading}
            />

            {!file ? (
                <div
                    onClick={handleClick}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-gray-700 hover:border-gray-600 bg-black/50"
                        }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
                >
                    <div className="flex flex-col items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDragging ? "bg-orange-500/20" : "bg-gray-800"}`}>
                            <Upload className={`w-6 h-6 ${isDragging ? "text-orange-500" : "text-gray-400"}`} />
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">
                                {isDragging ? "Drop your video here" : "Drag and drop your video"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                or click to browse • MP4, WebM, MOV • Max 3 minutes
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative border border-gray-700 rounded-xl p-4 bg-black/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${error ? "bg-red-500/10" : uploadComplete ? "bg-green-500/10" : "bg-orange-500/10"
                            }`}>
                            {error ? (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : uploadComplete ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : uploading ? (
                                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                            ) : (
                                <Upload className="w-5 h-5 text-orange-500" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                                {(file.size / (1024 * 1024)).toFixed(1)} MB
                                {error && <span className="text-red-400 ml-2">• {error}</span>}
                                {uploadComplete && <span className="text-green-400 ml-2">• Ready to analyze</span>}
                            </p>
                        </div>

                        {!uploading && (
                            <button
                                onClick={handleRemove}
                                className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>

                    {/* Progress bar */}
                    {uploading && (
                        <div className="mt-3">
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                                Uploading... {uploadProgress}%
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
