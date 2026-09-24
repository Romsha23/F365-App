import * as Crypto from 'expo-crypto';

/**
 * Generates a unique ID for a user
 * This is used instead of storing personally identifiable information
 */
export const generateUniqueId = (): string => {
  // Generate a UUID v4
  const uuid = Crypto.randomUUID();
  
  // Create a shorter, more user-friendly ID by taking parts of the UUID
  // and adding a timestamp component for uniqueness
  const timestamp = Date.now().toString(36);
  const shortId = uuid.split('-')[0] + timestamp.slice(-4);
  
  return `uid_${shortId}`;
};

/**
 * Encrypts sensitive data before storage
 * In a real app, this would use more robust encryption
 */
export const encryptData = async (data: string): Promise<string> => {
  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  
  const base64 = btoa(unescape(encodeURIComponent(data)));
  return base64 + '.' + hashHex.substring(0, 16);
};

/**
 * Decrypts data for use in the app
 * In a real app, this would use more robust decryption
 */
export const decryptData = (encryptedData: string): string => {
  const parts = encryptedData.split('.');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted data format');
  }
  
  try {
    return decodeURIComponent(escape(atob(parts[0])));
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Anonymizes data by removing or masking PII
 */
export const anonymizeData = (data: any): any => {
  if (!data) return data;
  
  // Deep clone the data to avoid modifying the original
  const clonedData = JSON.parse(JSON.stringify(data));
  
  // List of fields to anonymize
  const piiFields = [
    'name', 
    'firstName', 
    'lastName', 
    'fullName', 
    'displayName',
    'address',
    'street',
    'city',
    'state',
    'postalCode',
    'phone',
    'phoneNumber',
    'ssn',
    'socialSecurityNumber'
  ];
  
  // Recursively process the object
  const processObject = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
      // If this is a PII field, anonymize it
      if (piiFields.includes(key) && typeof obj[key] === 'string') {
        // Replace with anonymized version
        if (key.includes('name') || key.includes('Name')) {
          obj[key] = '****';
        } else if (key.includes('address') || key.includes('street') || key.includes('city') || key.includes('state')) {
          obj[key] = '****';
        } else if (key.includes('phone')) {
          // Keep last 4 digits of phone
          const phone = obj[key];
          if (phone && phone.length > 4) {
            obj[key] = '****' + phone.slice(-4);
          } else {
            obj[key] = '****';
          }
        } else if (key.includes('ssn') || key.includes('socialSecurity')) {
          obj[key] = '****';
        } else {
          obj[key] = '****';
        }
      } 
      // If this is an object or array, process it recursively
      else if (typeof obj[key] === 'object') {
        processObject(obj[key]);
      }
    });
  };
  
  processObject(clonedData);
  return clonedData;
};

/**
 * Securely hashes a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  // In a real app, use a proper password hashing algorithm with salt
  // For demo purposes, we'll just use SHA-256
  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  
  // digestStringAsync already returns a hex string, no need to convert
  return hashHex;
};

export const encryptObject = async (obj: any): Promise<string> => {
  const jsonString = JSON.stringify(obj);
  return await encryptData(jsonString);
};

export const decryptObject = (encryptedData: string): any => {
  try {
    const decryptedString = decryptData(encryptedData);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Error decrypting object:', error);
    return null;
  }
};