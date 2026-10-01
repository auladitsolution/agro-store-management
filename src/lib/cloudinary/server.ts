import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export async function uploadToCloudinary(
  fileBase64OrBuffer: string,
  folder: 'branding' | 'products' | 'expenses' | 'purchases' = 'products'
): Promise<{ url: string; publicId: string } | null> {
  if (!process.env.CLOUDINARY_API_SECRET) {
    console.warn('Cloudinary API secret not configured. Returning placeholder or raw URI.');
    return {
      url: fileBase64OrBuffer.startsWith('data:') ? fileBase64OrBuffer : '',
      publicId: 'local_placeholder',
    };
  }

  try {
    const result = await cloudinary.uploader.upload(fileBase64OrBuffer, {
      folder: `agro-store/${folder}`,
      resource_type: 'auto',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('ছবি আপলোড ব্যর্থ হয়েছে।');
  }
}
