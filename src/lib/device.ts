/**
 * Device Binding System
 * Permet de lier un compte à un appareil unique pour éviter le partage de compte
 */

export function generateDeviceId(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'device-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getStoredDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('deviceId');
}

export function storeDeviceId(deviceId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('deviceId', deviceId);
  }
}

/**
 * Obtenir ou créer un device ID persistant
 * Utilisé pour tracker l'appareil de l'étudiant
 */
export function getOrCreateDeviceId(): string {
  let deviceId = getStoredDeviceId();
  
  if (!deviceId) {
    deviceId = generateDeviceId();
    storeDeviceId(deviceId);
  }
  
  return deviceId;
}

/**
 * Vérifier si le device est autorisé pour cet utilisateur
 * @param userDeviceId - Device ID lié au compte utilisateur (null = pas encore lié)
 * @param currentDeviceId - Device ID actuel
 * @returns { allowed: boolean, message: string }
 */
export function validateDeviceAccess(userDeviceId: string | null, currentDeviceId: string): { allowed: boolean; message: string } {
  // Si l'utilisateur n'a pas encore d'appareil lié, autoriser
  if (!userDeviceId) {
    return {
      allowed: true,
      message: 'Device lié à ce compte',
    };
  }

  // Vérifier que c'est le même appareil
  if (userDeviceId === currentDeviceId) {
    return {
      allowed: true,
      message: 'Appareil autorisé',
    };
  }

  // Appareil différent = accès refusé
  return {
    allowed: false,
    message: 'Cet appareil n\'est pas autorisé. Ce compte a été enregistré sur un autre appareil.',
  };
}
