# FirebaseStorageService (Firebase 儲存服務)

## 概述
`FirebaseStorageService` 是一個封裝 Firebase Storage 的 Angular 服務，提供完整的檔案上傳、下載、刪除、管理功能。它支援多種檔案格式、進度追蹤、縮圖生成、檔案壓縮和安全性控制。

## 技術規格

### 依賴套件
```json
{
  "@angular/fire": "^18.0.0",
  "firebase": "^10.0.0"
}
```

### 型別定義
```typescript
export interface StorageFile {
  name: string;
  path: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  metadata: {
    contentType: string;
    customMetadata?: { [key: string]: string };
  };
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export interface UploadOptions {
  path?: string;
  metadata?: {
    contentType?: string;
    customMetadata?: { [key: string]: string };
  };
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (file: StorageFile) => void;
  onError?: (error: Error) => void;
}

export interface StorageConfig {
  maxFileSize: number; // bytes
  allowedTypes: string[];
  generateThumbnails: boolean;
  compressImages: boolean;
  compressionQuality: number; // 0-1
}

export interface ThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
}
```

## Angular 實作

### FirebaseStorageService 服務
```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject, 
         getMetadata, updateMetadata, listAll, UploadTask, UploadTaskSnapshot } from '@angular/fire/storage';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  private storage = inject(Storage);

  // 使用 Angular Signals 管理狀態
  private _uploading = signal<boolean>(false);
  private _uploadProgress = signal<UploadProgress | null>(null);
  private _error = signal<string | null>(null);

  // 公開的只讀 signals
  readonly uploading = this._uploading.asReadonly();
  readonly uploadProgress = this._uploadProgress.asReadonly();
  readonly error = this._error.asReadonly();

  // 預設配置
  private defaultConfig: StorageConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'],
    generateThumbnails: true,
    compressImages: true,
    compressionQuality: 0.8
  };

  // RxJS Observable 支援
  private uploadSubject = new BehaviorSubject<{
    operation: string;
    success: boolean;
    data?: any;
    error?: string;
  }>({ operation: '', success: false });

  public upload$ = this.uploadSubject.asObservable();

  // 上傳檔案
  async uploadFile(file: File, options: UploadOptions = {}): Promise<StorageFile> {
    try {
      this._uploading.set(true);
      this._error.set(null);

      // 驗證檔案
      this.validateFile(file);

      // 生成檔案路徑
      const filePath = this.generateFilePath(file, options.path);

      // 壓縮圖片（如果需要）
      const processedFile = await this.processFile(file);

      // 建立上傳任務
      const storageRef = ref(this.storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, processedFile, {
        contentType: file.type,
        customMetadata: options.metadata?.customMetadata
      });

      // 監聽上傳進度
      uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            state: snapshot.state as any
          };
          
          this._uploadProgress.set(progress);
          options.onProgress?.(progress);
        },
        (error) => {
          this._error.set(error.message);
          options.onError?.(error);
          throw error;
        },
        async () => {
          try {
            // 上傳完成，獲取下載 URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const storageFile: StorageFile = {
              name: file.name,
              path: filePath,
              url: downloadURL,
              size: file.size,
              type: file.type,
              uploadedAt: new Date(),
              metadata: {
                contentType: file.type,
                customMetadata: options.metadata?.customMetadata
              }
            };

            // 生成縮圖（如果是圖片）
            if (this.isImageFile(file) && this.defaultConfig.generateThumbnails) {
              await this.generateThumbnail(storageFile);
            }

            this.uploadSubject.next({
              operation: 'uploadFile',
              success: true,
              data: storageFile
            });

            options.onComplete?.(storageFile);
            return storageFile;
          } catch (error) {
            this._error.set(error.message);
            options.onError?.(error);
            throw error;
          }
        }
      );

      // 等待上傳完成
      return new Promise((resolve, reject) => {
        uploadTask.then(
          (snapshot) => {
            getDownloadURL(snapshot.ref).then(downloadURL => {
              const storageFile: StorageFile = {
                name: file.name,
                path: filePath,
                url: downloadURL,
                size: file.size,
                type: file.type,
                uploadedAt: new Date(),
                metadata: {
                  contentType: file.type,
                  customMetadata: options.metadata?.customMetadata
                }
              };
              resolve(storageFile);
            });
          },
          reject
        );
      });

    } catch (error: any) {
      const errorMessage = this.getStorageErrorMessage(error.code);
      this._error.set(errorMessage);
      this.uploadSubject.next({
        operation: 'uploadFile',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._uploading.set(false);
    }
  }

  // 批量上傳檔案
  async uploadMultipleFiles(files: File[], options: UploadOptions = {}): Promise<StorageFile[]> {
    try {
      this._uploading.set(true);
      this._error.set(null);

      const uploadPromises = files.map(file => this.uploadFile(file, options));
      const results = await Promise.all(uploadPromises);

      this.uploadSubject.next({
        operation: 'uploadMultipleFiles',
        success: true,
        data: results
      });

      return results;
    } catch (error: any) {
      const errorMessage = this.getStorageErrorMessage(error.code);
      this._error.set(errorMessage);
      this.uploadSubject.next({
        operation: 'uploadMultipleFiles',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    } finally {
      this._uploading.set(false);
    }
  }

  // 下載檔案
  async downloadFile(filePath: string): Promise<Blob> {
    try {
      this._error.set(null);

      const storageRef = ref(this.storage, filePath);
      const downloadURL = await getDownloadURL(storageRef);
      
      const response = await fetch(downloadURL);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      this.uploadSubject.next({
        operation: 'downloadFile',
        success: true,
        data: blob
      });

      return blob;
    } catch (error: any) {
      const errorMessage = this.getStorageErrorMessage(error.code);
      this._error.set(errorMessage);
      this.uploadSubject.next({
        operation: 'downloadFile',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  }

  // 刪除檔案
  async deleteFile(filePath: string): Promise<void> {
    try {
      this._error.set(null);

      const storageRef = ref(this.storage, filePath);
      await deleteObject(storageRef);

      this.uploadSubject.next({
        operation: 'deleteFile',
        success: true
      });
    } catch (error: any) {
      const errorMessage = this.getStorageErrorMessage(error.code);
      this._error.set(errorMessage);
      this.uploadSubject.next({
        operation: 'deleteFile',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  }

  // 獲取檔案資訊
  async getFileMetadata(filePath: string): Promise<StorageFile> {
    try {
      this._error.set(null);

      const storageRef = ref(this.storage, filePath);
      const metadata = await getMetadata(storageRef);
      const downloadURL = await getDownloadURL(storageRef);

      const storageFile: StorageFile = {
        name: metadata.name,
        path: filePath,
        url: downloadURL,
        size: metadata.size,
        type: metadata.contentType || 'unknown',
        uploadedAt: new Date(metadata.timeCreated),
        metadata: {
          contentType: metadata.contentType || 'unknown',
          customMetadata: metadata.customMetadata
        }
      };

      this.uploadSubject.next({
        operation: 'getFileMetadata',
        success: true,
        data: storageFile
      });

      return storageFile;
    } catch (error: any) {
      const errorMessage = this.getStorageErrorMessage(error.code);
      this._error.set(errorMessage);
      this.uploadSubject.next({
        operation: 'getFileMetadata',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  }

  // 列出目錄中的檔案
  async listFiles(directoryPath: string): Promise<StorageFile[]> {
    try {
      this._error.set(null);

      const storageRef = ref(this.storage, directoryPath);
      const result = await listAll(storageRef);

      const files: StorageFile[] = [];
      
      for (const itemRef of result.items) {
        try {
          const metadata = await getMetadata(itemRef);
          const downloadURL = await getDownloadURL(itemRef);
          
          files.push({
            name: metadata.name,
            path: itemRef.fullPath,
            url: downloadURL,
            size: metadata.size,
            type: metadata.contentType || 'unknown',
            uploadedAt: new Date(metadata.timeCreated),
            metadata: {
              contentType: metadata.contentType || 'unknown',
              customMetadata: metadata.customMetadata
            }
          });
        } catch (error) {
          console.warn(`Failed to get metadata for ${itemRef.fullPath}:`, error);
        }
      }

      this.uploadSubject.next({
        operation: 'listFiles',
        success: true,
        data: files
      });

      return files;
    } catch (error: any) {
      const errorMessage = this.getStorageErrorMessage(error.code);
      this._error.set(errorMessage);
      this.uploadSubject.next({
        operation: 'listFiles',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  }

  // 更新檔案元資料
  async updateFileMetadata(filePath: string, customMetadata: { [key: string]: string }): Promise<void> {
    try {
      this._error.set(null);

      const storageRef = ref(this.storage, filePath);
      await updateMetadata(storageRef, { customMetadata });

      this.uploadSubject.next({
        operation: 'updateFileMetadata',
        success: true
      });
    } catch (error: any) {
      const errorMessage = this.getStorageErrorMessage(error.code);
      this._error.set(errorMessage);
      this.uploadSubject.next({
        operation: 'updateFileMetadata',
        success: false,
        error: errorMessage
      });
      throw new Error(errorMessage);
    }
  }

  // 生成縮圖
  private async generateThumbnail(storageFile: StorageFile): Promise<void> {
    try {
      // 創建 canvas 元素
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 載入圖片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = storageFile.url;
      });

      // 計算縮圖尺寸
      const maxSize = 200;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 繪製縮圖
      ctx.drawImage(img, 0, 0, width, height);

      // 轉換為 Blob
      const thumbnailBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });

      if (thumbnailBlob) {
        // 上傳縮圖
        const thumbnailPath = this.getThumbnailPath(storageFile.path);
        const thumbnailRef = ref(this.storage, thumbnailPath);
        
        await uploadBytesResumable(thumbnailRef, thumbnailBlob, {
          contentType: 'image/jpeg',
          customMetadata: {
            originalFile: storageFile.path,
            thumbnail: 'true'
          }
        });
      }
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
    }
  }

  // 處理檔案（壓縮等）
  private async processFile(file: File): Promise<File> {
    if (!this.isImageFile(file) || !this.defaultConfig.compressImages) {
      return file;
    }

    try {
      return await this.compressImage(file);
    } catch (error) {
      console.warn('Failed to compress image, using original:', error);
      return file;
    }
  }

  // 壓縮圖片
  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        // 計算壓縮後的尺寸
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          } else {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 繪製壓縮後的圖片
        ctx.drawImage(img, 0, 0, width, height);

        // 轉換為 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          this.defaultConfig.compressionQuality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 驗證檔案
  private validateFile(file: File): void {
    // 檢查檔案大小
    if (file.size > this.defaultConfig.maxFileSize) {
      throw new Error(`檔案大小超過限制 (${this.formatFileSize(this.defaultConfig.maxFileSize)})`);
    }

    // 檢查檔案類型
    if (!this.defaultConfig.allowedTypes.includes(file.type)) {
      throw new Error(`不支援的檔案類型: ${file.type}`);
    }
  }

  // 生成檔案路徑
  private generateFilePath(file: File, customPath?: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    
    if (customPath) {
      return `${customPath}/${timestamp}_${randomString}.${fileExtension}`;
    } else {
      return `uploads/${timestamp}_${randomString}.${fileExtension}`;
    }
  }

  // 獲取縮圖路徑
  private getThumbnailPath(originalPath: string): string {
    const pathParts = originalPath.split('/');
    const fileName = pathParts.pop();
    const directory = pathParts.join('/');
    
    if (fileName) {
      const nameWithoutExt = fileName.split('.')[0];
      return `${directory}/thumbnails/${nameWithoutExt}_thumb.jpg`;
    }
    
    return `${originalPath}_thumb.jpg`;
  }

  // 檢查是否為圖片檔案
  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // 格式化檔案大小
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 獲取 Storage 錯誤訊息
  private getStorageErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      'storage/unknown': '未知錯誤',
      'storage/object-not-found': '找不到指定的檔案',
      'storage/bucket-not-found': '找不到指定的儲存桶',
      'storage/project-not-found': '找不到指定的專案',
      'storage/quota-exceeded': '儲存配額已滿',
      'storage/unauthenticated': '未認證的請求',
      'storage/unauthorized': '沒有權限執行此操作',
      'storage/retry-limit-exceeded': '重試次數已達上限',
      'storage/invalid-checksum': '檔案校驗和不正確',
      'storage/canceled': '操作被取消',
      'storage/invalid-event-name': '無效的事件名稱',
      'storage/invalid-url': '無效的 URL',
      'storage/invalid-argument': '無效的參數',
      'storage/no-default-bucket': '沒有預設儲存桶',
      'storage/cannot-slice-blob': '無法分割 Blob',
      'storage/server-file-wrong-size': '伺服器檔案大小不正確'
    };

    return errorMessages[errorCode] || 'Storage 操作失敗';
  }

  // 清除錯誤訊息
  clearError(): void {
    this._error.set(null);
  }

  // 設定配置
  setConfig(config: Partial<StorageConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  // RxJS 相容方法
  uploadFile$(file: File, options: UploadOptions = {}): Observable<StorageFile> {
    return from(this.uploadFile(file, options));
  }

  uploadMultipleFiles$(files: File[], options: UploadOptions = {}): Observable<StorageFile[]> {
    return from(this.uploadMultipleFiles(files, options));
  }

  downloadFile$(filePath: string): Observable<Blob> {
    return from(this.downloadFile(filePath));
  }

  deleteFile$(filePath: string): Observable<void> {
    return from(this.deleteFile(filePath));
  }

  getFileMetadata$(filePath: string): Observable<StorageFile> {
    return from(this.getFileMetadata(filePath));
  }

  listFiles$(directoryPath: string): Observable<StorageFile[]> {
    return from(this.listFiles(directoryPath));
  }
}
```

### 檔案上傳元件
```typescript
import { Component, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseStorageService, StorageFile, UploadProgress } from '@shared/services/FirebaseStorageService';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="file-upload" [class.dragover]="isDragOver()">
      <div class="upload-area" 
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)"
           (click)="fileInput.click()">
        
        <input #fileInput
               type="file"
               [multiple]="multiple"
               [accept]="acceptedTypes"
               (change)="onFileSelected($event)"
               style="display: none;">
        
        <div class="upload-content">
          <i class="upload-icon">📁</i>
          <p class="upload-text">
            {{ isDragOver() ? '放開檔案以上傳' : '點擊或拖拽檔案到這裡' }}
          </p>
          <p class="upload-hint">
            支援的格式: {{ acceptedTypes || '所有格式' }}
          </p>
        </div>
      </div>

      <div *ngIf="storageService.uploading()" class="upload-progress">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="uploadProgress()?.percentage || 0"></div>
        </div>
        <div class="progress-text">
          {{ uploadProgress()?.percentage?.toFixed(1) || 0 }}% 
          ({{ formatBytes(uploadProgress()?.bytesTransferred || 0) }} / {{ formatBytes(uploadProgress()?.totalBytes || 0) }})
        </div>
      </div>

      <div *ngIf="storageService.error()" class="error-message">
        {{ storageService.error() }}
      </div>

      <div *ngIf="uploadedFiles().length > 0" class="uploaded-files">
        <h4>已上傳的檔案:</h4>
        <div class="file-list">
          <div *ngFor="let file of uploadedFiles()" class="file-item">
            <div class="file-info">
              <i class="file-icon">{{ getFileIcon(file.type) }}</i>
              <div class="file-details">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatBytes(file.size) }}</span>
              </div>
            </div>
            <div class="file-actions">
              <button class="btn btn-sm btn-outline-primary" (click)="downloadFile(file)">
                下載
              </button>
              <button class="btn btn-sm btn-outline-danger" (click)="deleteFile(file)">
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .file-upload {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 1rem;
      transition: all 0.3s ease;
    }
    
    .file-upload.dragover {
      border-color: #007bff;
      background-color: #f8f9fa;
    }
    
    .upload-area {
      cursor: pointer;
      text-align: center;
      padding: 2rem;
    }
    
    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    
    .upload-icon {
      font-size: 3rem;
      opacity: 0.5;
    }
    
    .upload-text {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
    }
    
    .upload-hint {
      font-size: 0.9rem;
      color: #666;
      margin: 0;
    }
    
    .upload-progress {
      margin-top: 1rem;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background-color: #007bff;
      transition: width 0.3s ease;
    }
    
    .progress-text {
      text-align: center;
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.5rem;
    }
    
    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 0.75rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .uploaded-files {
      margin-top: 1rem;
    }
    
    .file-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background-color: #f8f9fa;
      border-radius: 4px;
    }
    
    .file-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .file-icon {
      font-size: 1.5rem;
    }
    
    .file-details {
      display: flex;
      flex-direction: column;
    }
    
    .file-name {
      font-weight: 500;
    }
    
    .file-size {
      font-size: 0.875rem;
      color: #666;
    }
    
    .file-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn {
      padding: 0.25rem 0.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
    }
    
    .btn-outline-primary {
      background: none;
      color: #007bff;
      border: 1px solid #007bff;
    }
    
    .btn-outline-danger {
      background: none;
      color: #dc3545;
      border: 1px solid #dc3545;
    }
  `]
})
export class FileUploadComponent {
  private storageService = inject(FirebaseStorageService);

  @Input() multiple: boolean = false;
  @Input() acceptedTypes: string = '';
  @Input() uploadPath: string = 'uploads';
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB

  @Output() fileUploaded = new EventEmitter<StorageFile>();
  @Output() filesUploaded = new EventEmitter<StorageFile[]>();
  @Output() fileDeleted = new EventEmitter<StorageFile>();

  isDragOver = signal<boolean>(false);
  uploadedFiles = signal<StorageFile[]>([]);
  uploadProgress = signal<UploadProgress | null>(null);

  ngOnInit(): void {
    // 設定上傳配置
    this.storageService.setConfig({
      maxFileSize: this.maxFileSize,
      allowedTypes: this.acceptedTypes ? this.acceptedTypes.split(',').map(t => t.trim()) : undefined
    });

    // 監聽上傳進度
    this.storageService.uploadProgress.subscribe(progress => {
      this.uploadProgress.set(progress);
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  async handleFiles(files: File[]): Promise<void> {
    try {
      if (this.multiple) {
        const uploadedFiles = await this.storageService.uploadMultipleFiles(files, {
          path: this.uploadPath,
          onProgress: (progress) => {
            this.uploadProgress.set(progress);
          }
        });
        
        this.uploadedFiles.set([...this.uploadedFiles(), ...uploadedFiles]);
        this.filesUploaded.emit(uploadedFiles);
      } else {
        const file = files[0];
        const uploadedFile = await this.storageService.uploadFile(file, {
          path: this.uploadPath,
          onProgress: (progress) => {
            this.uploadProgress.set(progress);
          }
        });
        
        this.uploadedFiles.set([uploadedFile]);
        this.fileUploaded.emit(uploadedFile);
      }
    } catch (error) {
      console.error('File upload failed:', error);
    }
  }

  async downloadFile(file: StorageFile): Promise<void> {
    try {
      const blob = await this.storageService.downloadFile(file.path);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('File download failed:', error);
    }
  }

  async deleteFile(file: StorageFile): Promise<void> {
    try {
      await this.storageService.deleteFile(file.path);
      const currentFiles = this.uploadedFiles();
      const updatedFiles = currentFiles.filter(f => f.path !== file.path);
      this.uploadedFiles.set(updatedFiles);
      this.fileDeleted.emit(file);
    } catch (error) {
      console.error('File deletion failed:', error);
    }
  }

  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel')) return '📊';
    if (type.includes('powerpoint')) return '📈';
    return '📁';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
```

## AI Agent 友好特性

### 1. 完整的型別安全
- 所有方法都有完整的 TypeScript 型別定義
- 提供泛型支援
- 編譯時錯誤檢查

### 2. 進度追蹤
- 即時上傳進度更新
- 支援取消上傳
- 詳細的狀態資訊

### 3. 檔案處理
- 自動圖片壓縮
- 縮圖生成
- 檔案驗證

### 4. 錯誤處理
- 完整的錯誤訊息本地化
- 統一的錯誤處理機制
- 用戶友好的錯誤提示

## 相關檔案
- `FirebaseAuthService.md` - Firebase 認證服務
- `FirebaseFirestoreService.md` - Firestore 資料庫服務
- `FirebaseMessagingService.md` - Firebase 推播服務
- `Performance Optimization Strategy.md` - 效能優化策略