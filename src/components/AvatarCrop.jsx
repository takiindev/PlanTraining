import { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './AvatarCrop.css';

/**
 * Component để crop avatar với tỷ lệ 1:1
 */
function AvatarCrop({ onCropComplete, onCancel, imageFile }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [imgSrc, setImgSrc] = useState();
  const imgRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Đọc file ảnh và hiển thị
  useState(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  // Khi ảnh load xong, tạo crop mặc định
  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1, // Aspect ratio 1:1
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  // Xử lý khi hoàn thành crop
  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    setIsProcessing(true);

    try {
      // Tạo canvas để crop ảnh
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Không thể tạo canvas context');
      }

      const image = imgRef.current;
      const crop = completedCrop;

      // Tính toán kích thước crop
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set kích thước canvas (avatar sẽ là 300x300px)
      const cropSize = 300;
      canvas.width = cropSize;
      canvas.height = cropSize;

      // Crop và resize ảnh
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        cropSize,
        cropSize
      );

      // Chuyển canvas thành blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Không thể tạo blob từ canvas');
            setIsProcessing(false);
            return;
          }

          // Tạo file từ blob
          const croppedFile = new File([blob], 'avatar.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          onCropComplete(croppedFile);
          setIsProcessing(false);
        },
        'image/jpeg',
        0.95 // Chất lượng 95%
      );
    } catch (error) {
      console.error('Lỗi khi crop ảnh:', error);
      setIsProcessing(false);
    }
  }, [completedCrop, onCropComplete]);

  return (
    <div className="avatar-crop-container">
      <div className="avatar-crop-header">
        <h3>Chỉnh sửa Avatar</h3>
        <p>Kéo và thả để điều chỉnh vị trí ảnh</p>
      </div>
      
      <div className="avatar-crop-content">
        {imgSrc && (
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1} // Tỷ lệ 1:1
            minWidth={100}
            minHeight={100}
            keepSelection
          >
            <img
              ref={imgRef}
              alt="Crop preview"
              src={imgSrc}
              onLoad={onImageLoad}
              className="avatar-crop-image"
            />
          </ReactCrop>
        )}
      </div>

      <div className="avatar-crop-actions">
        <button
          type="button"
          onClick={onCancel}
          className="avatar-crop-cancel-btn"
          disabled={isProcessing}
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleCropComplete}
          className="avatar-crop-confirm-btn"
          disabled={isProcessing || !completedCrop}
        >
          {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
        </button>
      </div>
    </div>
  );
}

export default AvatarCrop;
