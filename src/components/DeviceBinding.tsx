'use client';

import { useEffect } from 'react';
import { generateDeviceId, getStoredDeviceId, storeDeviceId } from '@/lib/device';

export default function DeviceBinding() {
  useEffect(() => {
    let deviceId = getStoredDeviceId();
    
    if (!deviceId) {
      deviceId = generateDeviceId();
      storeDeviceId(deviceId);
    }
  }, []);

  return null;
}
