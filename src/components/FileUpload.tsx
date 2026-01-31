'use client';

import { useState } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export default function FileUpload({ onUpload, accept = '.pdf,.jpg,.jpeg,.png', maxSize = 5 }: FileUploadProps) {
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    if (maxSize && file.size > maxSize * 1024 * 1024) {
      setError(`Fichier trop volumineux (max ${maxSize}MB)`);
      return;
    }

    onUpload(file);
  };

  return (
    <div>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
