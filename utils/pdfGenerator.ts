'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { weddingData } from '@/data';
import { getTranslation, type Language } from '@/i18n/translations';

export type GuestData = {
  firstName: string;
  lastName: string;
  attendanceType: 'single' | 'couple';
  partnerFirstName?: string;
  partnerLastName?: string;
};

export type InvitationMetadata = {
  fileName: string;
  invitationCode: string;
  verificationHash: string;
};

const scheduleTranslationKeys = [
  { title: 'guestArrival', description: 'guestArrivalDesc' },
  { title: 'ceremony', description: 'ceremonyDesc' },
  { title: 'reception', description: 'receptionDesc' },
  { title: 'firstDance', description: 'firstDanceDesc' },
] as const;

const getLocale = (language: Language) => {
  if (language === 'fr') return 'fr-FR';
  return 'en-GB';
};

const localize = (language: Language, key: string) => getTranslation(language, key);

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function extractCivilite(firstName: string): { civilite: 'Mr' | 'Mme' | 'Mlle' | null; cleanFirstName: string } {
  const normalized = normalizeWhitespace(firstName || '');
  const match = normalized.match(/^(mr|m\.?|monsieur|mme|madame|mlle|mademoiselle)\b\.?\s*/i);

  if (!match) {
    return { civilite: null, cleanFirstName: normalized };
  }

  const raw = match[1].toLowerCase().replace('.', '');
  const cleanFirstName = normalizeWhitespace(normalized.slice(match[0].length));

  if (raw === 'mme' || raw === 'madame') {
    return { civilite: 'Mme', cleanFirstName };
  }

  if (raw === 'mlle' || raw === 'mademoiselle') {
    return { civilite: 'Mlle', cleanFirstName };
  }

  return { civilite: 'Mr', cleanFirstName };
}

function buildFormalRecipient(guestData: GuestData) {
  if (guestData.attendanceType === 'couple') {
    const primary = normalizeWhitespace(`${guestData.firstName || ''} ${guestData.lastName || ''}`.replace(/^\s*couple\b\s*/i, ''));
    const partner = normalizeWhitespace(`${guestData.partnerFirstName || ''} ${guestData.partnerLastName || ''}`);
    const names = partner ? `${primary} & ${partner}` : primary;
    return normalizeWhitespace(`Couple ${names}`);
  }

  const { civilite, cleanFirstName } = extractCivilite(guestData.firstName || '');
  const fullName = normalizeWhitespace(`${cleanFirstName} ${guestData.lastName || ''}`);
  return civilite ? `${civilite} ${fullName}` : fullName;
}

export const generatePdfInvitation = async (
  guestData: GuestData,
  language: Language = 'en'
): Promise<InvitationMetadata> => {
  const scheduleHtml = weddingData.schedule
    .map((event, index) => {
      const translationKeys = scheduleTranslationKeys[index];
      const translatedTitle = translationKeys
        ? localize(language, translationKeys.title)
        : event.title;
      const translatedDescription = translationKeys
        ? localize(language, translationKeys.description)
        : event.description;

      return `
        <div style="margin: 5px 0 9px 0;">
          <p style="font-size: 11px; color: #d4af37; margin: 0; letter-spacing: 0.3px; font-family: Georgia, serif;">
            <strong>${escapeHtml(event.time)}</strong> — ${escapeHtml(translatedTitle)}
          </p>
          <p style="font-size: 10px; color: #efe0b5; margin: 3px 0 0 0; line-height: 1.35; font-family: Georgia, serif;">
            ${escapeHtml(translatedDescription)}
          </p>
        </div>
      `;
    })
    .join('');

  const formattedWeddingDate = new Date(weddingData.weddingDate).toLocaleDateString(
    getLocale(language),
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );

  const sanitizedFirst = guestData.firstName.replace(/[^a-z0-9]/gi, '');
  const sanitizedLast = guestData.lastName.replace(/[^a-z0-9]/gi, '');
  const sanitizedPartnerFirst = (guestData.partnerFirstName || '').replace(/[^a-z0-9]/gi, '');
  const sanitizedPartnerLast = (guestData.partnerLastName || '').replace(/[^a-z0-9]/gi, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const fileName = `franck-charly-invitation-${language}-${sanitizedFirst}-${sanitizedLast}${sanitizedPartnerFirst ? `-${sanitizedPartnerFirst}-${sanitizedPartnerLast}` : ''}-${timestamp}-${randomSuffix}.pdf`;

  const invitationCode = buildInvitationCode();
  const verificationHash = await buildVerificationHash({
    firstName: guestData.firstName,
    lastName: guestData.lastName,
    attendanceType: guestData.attendanceType,
    partnerFirstName: guestData.partnerFirstName,
    partnerLastName: guestData.partnerLastName,
    invitationCode,
    timestamp,
  });
  const guestCount = guestData.attendanceType === 'couple' ? 2 : 1;
  const primaryGuestFullName = `${guestData.firstName} ${guestData.lastName}`.trim();
  const partnerGuestFullName = `${guestData.partnerFirstName || ''} ${guestData.partnerLastName || ''}`.trim();
  const invitedGuestsText =
    guestData.attendanceType === 'couple' && partnerGuestFullName
      ? `${primaryGuestFullName} & ${partnerGuestFullName}`
      : primaryGuestFullName;
  const formalRecipient = buildFormalRecipient(guestData);

  const checkInUrl = buildCheckInUrl(invitationCode, verificationHash, invitedGuestsText, guestCount);
  const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
    width: 180,
    margin: 1,
    color: {
      dark: '#101010',
      light: '#f5e7b6',
    },
  });

  // Load calligraphic Google Font for names in PDF
  if (typeof document !== 'undefined' && document.fonts) {
    if (!document.getElementById('great-vibes-font')) {
      const fontLink = document.createElement('link');
      fontLink.id = 'great-vibes-font';
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
      document.head.appendChild(fontLink);
    }
    await document.fonts.ready;
    try { await document.fonts.load('400 70px "Great Vibes"'); } catch { /* use fallback */ }
  }

  // Create a temporary container for the invitation
  const container = document.createElement('div');
  
  // Use visibility: visible but position off-screen so it renders properly
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96 DPI
  container.style.height = '1123px'; // A4 height at 96 DPI
  container.style.overflow = 'hidden';

  container.innerHTML = `
    <div style="
      width: 100%;
      height: 100%;
      padding: 38px 48px;
      font-family: Georgia, 'Palatino Linotype', Palatino, 'Times New Roman', serif;
      background: radial-gradient(circle at 15% 15%, rgba(212,175,55,0.15), transparent 35%), radial-gradient(circle at 85% 25%, rgba(212,175,55,0.12), transparent 40%), linear-gradient(155deg, #050505 0%, #0f0f0f 55%, #161616 100%);
      border: 1.5px solid #d4af37;
      box-shadow: inset 0 0 0 7px rgba(16,16,16,0.92), inset 0 0 0 9px rgba(212,175,55,0.28);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      box-sizing: border-box;
      overflow: hidden;
    ">

      <div style="position: absolute; top: 16px; left: 16px; color: #d4af37; font-size: 22px; line-height: 1;">❀</div>
      <div style="position: absolute; top: 16px; right: 16px; color: #d4af37; font-size: 22px; line-height: 1;">❀</div>
      <div style="position: absolute; bottom: 16px; left: 16px; color: #d4af37; font-size: 22px; line-height: 1;">❀</div>
      <div style="position: absolute; bottom: 16px; right: 16px; color: #d4af37; font-size: 22px; line-height: 1;">❀</div>

      <p style="font-size: 10px; letter-spacing: 5px; color: #d4af37; text-transform: uppercase; margin: 0 0 14px 0; font-family: Georgia, serif;">
        ${escapeHtml(localize(language, 'pdfInvitationTitle'))}
      </p>

      <div style="display: flex; align-items: center; width: 100%; max-width: 580px; margin-bottom: 16px;">
        <div style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #d4af37);"></div>
        <span style="color: #d4af37; font-size: 14px; margin: 0 14px;">✦</span>
        <div style="flex: 1; height: 1px; background: linear-gradient(to left, transparent, #d4af37);"></div>
      </div>

      <p style="font-size: 16px; color: #f8e7b5; margin: 0 0 8px 0; font-weight: bold; font-style: italic; font-family: Georgia, serif;">
        ${escapeHtml(formalRecipient)}
      </p>

      <p style="font-size: 12.5px; color: #efe0b5; line-height: 1.7; margin: 0 0 10px 0; font-style: italic; max-width: 560px; font-family: Georgia, serif;">
        ${escapeHtml(localize(language, 'pdfFormalInvitationBody'))}
      </p>

      <div style="margin: 16px 0; padding: 16px 32px 12px; border-top: 1.5px solid rgba(212,175,55,0.6); border-bottom: 1.5px solid rgba(212,175,55,0.6); background: rgba(0,0,0,0.35); width: 100%; max-width: 580px; box-sizing: border-box;">
        <div style="line-height: 1.1; margin-bottom: 8px; white-space: nowrap;">
          <span style="font-family: 'Great Vibes', 'Palatino Linotype', Palatino, Georgia, cursive; font-size: 70px; font-style: italic; color: #f8e7b5;">Franck</span><span style="font-family: Georgia, serif; font-size: 40px; color: #d4af37; font-style: italic; padding: 0 18px; vertical-align: middle;">&amp;</span><span style="font-family: 'Great Vibes', 'Palatino Linotype', Palatino, Georgia, cursive; font-size: 70px; font-style: italic; color: #f8e7b5;">Charly</span>
        </div>
        <p style="font-size: 10px; letter-spacing: 5.5px; color: #d4af37; margin: 0; text-transform: uppercase; font-family: Georgia, serif;">
          Dimbi &nbsp;&#10022;&nbsp; Makanga
        </p>
      </div>

      <p style="font-size: 12.5px; color: #e9d8a6; margin: 0 0 5px 0; font-style: italic; font-family: Georgia, serif;">
        ${escapeHtml(localize(language, 'pdfToCelebrateWith'))}
      </p>

      <p style="font-size: 15px; color: #f8e7b5; margin: 0 0 4px 0; text-transform: capitalize; font-family: Georgia, serif;">
        ${escapeHtml(formattedWeddingDate)}
      </p>

      <p style="font-size: 12.5px; color: #efe0b5; margin: 2px 0; font-weight: bold; font-family: Georgia, serif;">
        ${escapeHtml(weddingData.venue.name)}
      </p>

      <p style="font-size: 10.5px; color: #d7c38a; margin: 2px 0 10px 0; font-family: Georgia, serif;">
        ${escapeHtml(weddingData.venue.address)}
      </p>

      <div style="display: flex; align-items: center; width: 100%; max-width: 580px; margin: 8px 0 12px;">
        <div style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #d4af37);"></div>
        <span style="color: #d4af37; font-size: 14px; margin: 0 14px;">✦</span>
        <div style="flex: 1; height: 1px; background: linear-gradient(to left, transparent, #d4af37);"></div>
      </div>

      <div style="width: 100%; max-width: 580px; text-align: left;">
        <p style="font-size: 9.5px; letter-spacing: 4px; color: #d4af37; text-transform: uppercase; margin: 0 0 8px 0; font-family: Georgia, serif; text-align: center;">
          ${escapeHtml(localize(language, 'pdfProgramAndDressCode'))}
        </p>
        <p style="font-size: 10px; color: #efe0b5; margin: 0 0 8px 0; text-align: center; font-family: Georgia, serif;">
          <strong>${escapeHtml(localize(language, 'dressCode'))}:</strong> ${escapeHtml(weddingData.dressCode)}
        </p>
        ${scheduleHtml}
      </div>

      <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 580px; border-top: 1px solid rgba(212,175,55,0.45); padding-top: 12px;">
        <div style="text-align: left; font-size: 10px; color: #e9d8a6; font-family: Georgia, serif; flex: 1; padding-right: 14px;">
          <p style="margin: 2px 0;">
            <strong>${escapeHtml(localize(language, 'pdfGuestCount'))}:</strong> ${guestCount}
          </p>
          <p style="margin: 2px 0;">
            <strong>${escapeHtml(localize(language, 'pdfGenerated'))}:</strong> ${new Date().toLocaleDateString(getLocale(language))}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 8.5px; letter-spacing: 0.5px; color: #d4af37; text-transform: uppercase; line-height: 1.45;">
            ${escapeHtml(localize(language, 'pdfValidIfListed'))}
          </p>
        </div>
        <div style="text-align: center; flex-shrink: 0;">
          <div style="width: 100px; border: 1px solid #d4af37; background: #f5e7b6; padding: 5px; border-radius: 6px;">
            <img src="${qrCodeDataUrl}" alt="QR" style="width: 100%; height: auto; display: block;" />
          </div>
          <p style="margin: 4px 0 0 0; font-size: 8.5px; letter-spacing: 0.8px; text-transform: uppercase; color: #d4af37; font-family: Georgia, serif;">
            ${escapeHtml(localize(language, 'pdfScanToValidate'))}
          </p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Give browser time to render the content
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Render HTML to canvas with optimal settings
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f0f0f',
      logging: false,
      allowTaint: true,
      imageTimeout: 15000,
      ignoreElements: (element) => {
        return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
      },
    });

    // Verify canvas has actual data
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering failed - invalid dimensions');
    }

    // Check canvas has pixel data
    const canvasData = canvas.getContext('2d');
    if (!canvasData) {
      throw new Error('Canvas context not available');
    }

    // Convert to image data - use JPEG for reliability
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    if (!imgData || imgData.length < 500) {
      throw new Error('Image rendering failed - output too small or empty');
    }

    // Get actual canvas dimensions to calculate proper PDF dimensions
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / canvasHeight;

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = pdfWidth / ratio;

    // Add image to PDF
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Save with sanitized filename
    pdf.save(fileName);
    return {
      fileName,
      invitationCode,
      verificationHash,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('PDF generation error:', errorMsg);
    throw new Error(`Failed to generate invitation: ${errorMsg}`);
  } finally {
    // Clean up
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function buildInvitationCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `FC-${datePart}-${randomPart}`;
}

async function buildVerificationHash(payload: Record<string, string | undefined>) {
  const normalized = Object.entries(payload)
    .map(([key, value]) => `${key}:${value || ''}`)
    .join('|');

  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    const bytes = Array.from(new Uint8Array(digest))
      .slice(0, 8)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
    return bytes.toUpperCase();
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(16).toUpperCase();
}

function buildCheckInUrl(
  invitationCode: string,
  verificationHash: string,
  guestName: string,
  guestCount: number
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');

  const url = new URL(baseUrl);
  url.searchParams.set('checkin', '1');
  url.searchParams.set('invitation', invitationCode);
  url.searchParams.set('hash', verificationHash);
  // Encode guest info directly in the URL so QR works on any device
  url.searchParams.set('guest', btoa(unescape(encodeURIComponent(guestName))));
  url.searchParams.set('count', String(guestCount));
  return url.toString();
}
