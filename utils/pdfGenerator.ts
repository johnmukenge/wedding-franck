'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { traditionalWeddingData, weddingData } from '@/data';
import { getTranslation, type Language } from '@/i18n/translations';
import type { GuestLogVariant } from '@/utils/guestLog';

export type GuestData = {
  title?: 'Mr' | 'Mme' | 'Mlle' | 'Couple';
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

const religiousScheduleTranslationKeys = [
  { title: 'guestArrival', description: 'guestArrivalDesc' },
  { title: 'ceremony', description: 'ceremonyDesc' },
  { title: 'reception', description: 'receptionDesc' },
  { title: 'firstDance', description: 'firstDanceDesc' },
] as const;

const traditionalScheduleTranslationKeys = [
  { title: 'familyArrival', description: 'familyArrivalDesc' },
] as const;

const religiousScheduleIcons = ['⛪', '📸', '🎉', '🎂'] as const;
const traditionalScheduleIcons = ['🌿'] as const;

const pdfTheme = {
  religious: {
    qrDark: '#101010',
    qrLight: '#f5e7b6',
    canvasBackground: '#0f0f0f',
    pageBackground:
      'radial-gradient(circle at 15% 15%, rgba(212,175,55,0.15), transparent 35%), radial-gradient(circle at 85% 25%, rgba(212,175,55,0.12), transparent 40%), linear-gradient(155deg, #050505 0%, #0f0f0f 55%, #161616 100%)',
    border: '#d4af37',
    inset: 'rgba(16,16,16,0.92)',
    insetBorder: 'rgba(212,175,55,0.28)',
    accent: '#d4af37',
    accentSoft: 'rgba(212,175,55,0.25)',
    textPrimary: '#f8e7b5',
    textSecondary: '#efe0b5',
    textMuted: '#d7c38a',
    sectionBg: 'rgba(255,255,255,0.03)',
    recipientBg: 'rgba(0,0,0,0.35)',
    qrBorder: '#d4af37',
  },
  traditional: {
    qrDark: '#0f3d91',
    qrLight: '#ffffff',
    canvasBackground: '#ffffff',
    pageBackground:
      'radial-gradient(circle at 12% 18%, rgba(59,130,246,0.18), transparent 34%), radial-gradient(circle at 82% 20%, rgba(163,230,53,0.2), transparent 36%), radial-gradient(circle at 25% 82%, rgba(250,204,21,0.18), transparent 30%), linear-gradient(160deg, #ffffff 0%, #f2fbff 55%, #fffde7 100%)',
    border: '#1d4ed8',
    inset: 'rgba(255,255,255,0.92)',
    insetBorder: 'rgba(163,230,53,0.35)',
    accent: '#1d4ed8',
    accentSoft: 'rgba(29,78,216,0.16)',
    textPrimary: '#082f49',
    textSecondary: '#0f172a',
    textMuted: '#365314',
    sectionBg: 'rgba(255,255,255,0.78)',
    recipientBg: 'linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(240,249,255,0.95) 55%, rgba(236,252,203,0.88) 100%)',
    qrBorder: '#84cc16',
  },
} as const;

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
  if (guestData.title === 'Couple' || guestData.attendanceType === 'couple') {
    const primary = normalizeWhitespace(`${guestData.firstName || ''} ${guestData.lastName || ''}`.replace(/^\s*couple\b\s*/i, ''));
    const partner = normalizeWhitespace(`${guestData.partnerFirstName || ''} ${guestData.partnerLastName || ''}`);
    const names = partner ? `${primary} & ${partner}` : primary;
    return normalizeWhitespace(`Couple ${names}`);
  }

  if (guestData.title) {
    const fullName = normalizeWhitespace(`${guestData.firstName || ''} ${guestData.lastName || ''}`);
    return `${guestData.title} ${fullName}`;
  }

  const { civilite, cleanFirstName } = extractCivilite(guestData.firstName || '');
  const fullName = normalizeWhitespace(`${cleanFirstName} ${guestData.lastName || ''}`);
  return civilite ? `${civilite} ${fullName}` : fullName;
}

function getTraditionalSalutationPrefix(guestData: GuestData): 'Mr' | 'Mme' | 'Mlle' | 'Couple' {
  if (guestData.title === 'Couple' || guestData.attendanceType === 'couple') {
    return 'Couple';
  }

  if (guestData.title === 'Mr' || guestData.title === 'Mme' || guestData.title === 'Mlle') {
    return guestData.title;
  }

  const { civilite } = extractCivilite(guestData.firstName || '');
  return civilite || 'Mr';
}

export const generatePdfInvitation = async (
  guestData: GuestData,
  language: Language = 'en',
  variant: GuestLogVariant = 'religious'
): Promise<InvitationMetadata> => {
  const eventData = variant === 'traditional' ? traditionalWeddingData : weddingData;
  const theme = pdfTheme[variant];
  const scheduleTranslationKeys =
    variant === 'traditional' ? traditionalScheduleTranslationKeys : religiousScheduleTranslationKeys;
  const scheduleIcons = variant === 'traditional' ? traditionalScheduleIcons : religiousScheduleIcons;

  const scheduleHtml = eventData.schedule
    .map((event, index) => {
      const translationKeys = scheduleTranslationKeys[index];
      const icon = scheduleIcons[index] || '✦';
      const translatedTitle = translationKeys
        ? localize(language, translationKeys.title)
        : event.title;
      const translatedDescription = translationKeys
        ? localize(language, translationKeys.description)
        : event.description;

      return `
        <div style="margin: 8px 0 10px 0; padding: 10px 12px; border: 1px solid ${theme.accentSoft}; border-radius: 14px; background: ${theme.sectionBg};">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <span style="font-size: 18px; line-height: 1; width: 24px; text-align: center;">${icon}</span>
            <div>
              <p style="font-size: 11px; color: ${theme.accent}; margin: 0; letter-spacing: 0.3px; font-family: Georgia, serif;">
                <strong>${escapeHtml(event.time)}</strong> — ${escapeHtml(translatedTitle)}
              </p>
              <p style="font-size: 10px; color: ${theme.textSecondary}; margin: 3px 0 0 0; line-height: 1.35; font-family: Georgia, serif;">
                ${escapeHtml(translatedDescription)}
              </p>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const eventDate = new Date(eventData.weddingDate);
  const formattedWeddingDate = eventDate.toLocaleDateString(
    getLocale(language),
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
  const formattedWeddingTime = eventDate.toLocaleTimeString(getLocale(language), {
    hour: '2-digit',
    minute: '2-digit',
  });

  const sanitizedFirst = guestData.firstName.replace(/[^a-z0-9]/gi, '');
  const sanitizedLast = guestData.lastName.replace(/[^a-z0-9]/gi, '');
  const sanitizedPartnerFirst = (guestData.partnerFirstName || '').replace(/[^a-z0-9]/gi, '');
  const sanitizedPartnerLast = (guestData.partnerLastName || '').replace(/[^a-z0-9]/gi, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  const fileName = `franck-charly-${variant}-invitation-${language}-${sanitizedFirst}-${sanitizedLast}${sanitizedPartnerFirst ? `-${sanitizedPartnerFirst}-${sanitizedPartnerLast}` : ''}-${timestamp}-${randomSuffix}.pdf`;

  const invitationCode = buildInvitationCode();
  const verificationHash = await buildVerificationHash({
    firstName: guestData.firstName,
    title: guestData.title,
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

  const checkInUrl = buildCheckInUrl(invitationCode, verificationHash, invitedGuestsText, guestCount, variant);
  const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
    width: 180,
    margin: 1,
    color: {
      dark: theme.qrDark,
      light: theme.qrLight,
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
      background: ${theme.pageBackground};
      border: 1.5px solid ${theme.border};
      box-shadow: inset 0 0 0 7px ${theme.inset}, inset 0 0 0 9px ${theme.insetBorder};
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      box-sizing: border-box;
      overflow: hidden;
    ">

      <div style="position: absolute; top: 16px; left: 16px; color: ${theme.accent}; font-size: 22px; line-height: 1;">❀</div>
      <div style="position: absolute; top: 16px; right: 16px; color: ${theme.accent}; font-size: 22px; line-height: 1;">❀</div>
      <div style="position: absolute; bottom: 16px; left: 16px; color: ${theme.accent}; font-size: 22px; line-height: 1;">❀</div>
      <div style="position: absolute; bottom: 16px; right: 16px; color: ${theme.accent}; font-size: 22px; line-height: 1;">❀</div>

      <p style="font-size: 10px; letter-spacing: 5px; color: ${theme.accent}; text-transform: uppercase; margin: 0 0 14px 0; font-family: Georgia, serif;">
        ${escapeHtml(variant === 'traditional' ? 'Invitation Mariage Traditionnel' : localize(language, 'pdfInvitationTitle'))}
      </p>

      ${
        variant === 'traditional'
          ? `<p style="font-size: 12px; color: ${theme.accent}; margin: 0 0 10px 0; font-family: Georgia, serif; font-weight: 600;">${escapeHtml(`${getTraditionalSalutationPrefix(guestData)}`)}</p>`
          : ''
      }

      <div style="display: flex; align-items: center; width: 100%; max-width: 580px; margin-bottom: 16px;">
        <div style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, ${theme.accent});"></div>
        <span style="color: ${theme.accent}; font-size: 14px; margin: 0 14px;">✦</span>
        <div style="flex: 1; height: 1px; background: linear-gradient(to left, transparent, ${theme.accent});"></div>
      </div>

      <p style="font-size: 16px; color: ${theme.textPrimary}; margin: 0 0 8px 0; font-weight: bold; font-style: italic; font-family: Georgia, serif;">
        ${escapeHtml(formalRecipient)}
      </p>

      <p style="font-size: 12.5px; color: ${theme.textSecondary}; line-height: 1.7; margin: 0 0 10px 0; font-style: italic; max-width: 560px; font-family: Georgia, serif;">
        ${escapeHtml(
          variant === 'traditional'
            ? localize(language, 'traditionalCoutumierIntro')
            : localize(language, 'pdfFormalInvitationBody')
        )}
      </p>

      ${
        variant === 'traditional'
          ? `<div style="margin: 6px 0 12px 0; padding: 16px 32px 12px; border-top: 1.5px solid ${theme.accentSoft}; border-bottom: 1.5px solid ${theme.accentSoft}; background: ${theme.recipientBg}; width: 100%; max-width: 580px; box-sizing: border-box;">
              <div style="line-height: 1.1; margin-bottom: 8px; white-space: nowrap; text-align: center;">
                <span style="font-family: 'Great Vibes', 'Palatino Linotype', Palatino, Georgia, cursive; font-size: 70px; font-style: italic; color: ${theme.textPrimary};">Franck</span><span style="font-family: Georgia, serif; font-size: 40px; color: #84cc16; font-style: italic; padding: 0 18px; vertical-align: middle;">&amp;</span><span style="font-family: 'Great Vibes', 'Palatino Linotype', Palatino, Georgia, cursive; font-size: 70px; font-style: italic; color: ${theme.textPrimary};">Charly</span>
              </div>
              <p style="font-size: 10px; letter-spacing: 5.5px; color: ${theme.accent}; margin: 0; text-transform: uppercase; font-family: Georgia, serif; text-align: center;">
                Dimbi &nbsp;&#10022;&nbsp; Makanga
              </p>
            </div>
            <p style="font-size: 12.5px; color: ${theme.textSecondary}; line-height: 1.7; margin: 0 0 12px 0; font-style: italic; max-width: 560px; font-family: Georgia, serif;">
              ${escapeHtml(localize(language, 'traditionalCoutumierOutro'))}
            </p>`
          : ''
      }

      ${
        variant === 'traditional'
          ? ''
          : `<div style="margin: 16px 0; padding: 16px 32px 12px; border-top: 1.5px solid ${theme.accentSoft}; border-bottom: 1.5px solid ${theme.accentSoft}; background: ${theme.recipientBg}; width: 100%; max-width: 580px; box-sizing: border-box;">
              <div style="line-height: 1.1; margin-bottom: 8px; white-space: nowrap;">
                <span style="font-family: 'Great Vibes', 'Palatino Linotype', Palatino, Georgia, cursive; font-size: 70px; font-style: italic; color: ${theme.textPrimary};">Franck</span><span style="font-family: Georgia, serif; font-size: 40px; color: ${theme.accent}; font-style: italic; padding: 0 18px; vertical-align: middle;">&amp;</span><span style="font-family: 'Great Vibes', 'Palatino Linotype', Palatino, Georgia, cursive; font-size: 70px; font-style: italic; color: ${theme.textPrimary};">Charly</span>
              </div>
              <p style="font-size: 10px; letter-spacing: 5.5px; color: ${theme.accent}; margin: 0; text-transform: uppercase; font-family: Georgia, serif;">
                Dimbi &nbsp;&#10022;&nbsp; Makanga
              </p>
            </div>`
      }

      <div style="width: 100%; max-width: 580px; display: grid; grid-template-columns: 1fr; gap: 10px; margin: 6px 0 10px 0;">
        <div style="border: 1px solid ${theme.accentSoft}; border-radius: 16px; padding: 12px 14px; background: ${theme.sectionBg}; text-align: left;">
          <p style="margin: 0 0 4px 0; color: ${theme.accent}; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-family: Georgia, serif;">
            📅 ${escapeHtml(localize(language, 'date'))}
          </p>
          <p style="margin: 0; color: ${theme.textPrimary}; font-size: 13px; text-transform: capitalize; font-family: Georgia, serif;">
            ${escapeHtml(formattedWeddingDate)}
          </p>
        </div>
        <div style="border: 1px solid ${theme.accentSoft}; border-radius: 16px; padding: 12px 14px; background: ${theme.sectionBg}; text-align: left;">
          <p style="margin: 0 0 4px 0; color: ${theme.accent}; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-family: Georgia, serif;">
            🕒 ${escapeHtml(localize(language, 'time'))}
          </p>
          <p style="margin: 0; color: ${theme.textPrimary}; font-size: 13px; text-transform: capitalize; font-family: Georgia, serif;">
            ${escapeHtml(formattedWeddingTime)}
          </p>
        </div>
        <div style="border: 1px solid ${theme.accentSoft}; border-radius: 16px; padding: 12px 14px; background: ${theme.sectionBg}; text-align: left;">
          <p style="margin: 0 0 4px 0; color: ${theme.accent}; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-family: Georgia, serif;">
            📍 ${escapeHtml(localize(language, 'venue'))}
          </p>
          <p style="margin: 0; color: ${theme.textPrimary}; font-size: 12.5px; font-weight: bold; font-family: Georgia, serif;">
            ${escapeHtml(eventData.venue.name)}
          </p>
          <p style="margin: 4px 0 0 0; color: ${theme.textMuted}; font-size: 10.5px; line-height: 1.5; font-family: Georgia, serif;">
            ${escapeHtml(eventData.venue.address)}
          </p>
        </div>
      </div>

      ${
        variant === 'traditional'
          ? `<div style="width: 100%; max-width: 580px; text-align: left; margin-top: 8px;">
              <div style="padding: 10px 12px; border: 1px solid ${theme.accentSoft}; border-radius: 14px; background: ${theme.sectionBg};">
                <p style="margin: 0; color: ${theme.accent}; font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; font-family: Georgia, serif;">
                  ${escapeHtml(localize(language, 'traditionalGenerosityTitle'))}
                </p>
                <p style="margin: 4px 0 0 0; color: ${theme.textSecondary}; font-size: 10px; line-height: 1.45; font-family: Georgia, serif;">
                  ${escapeHtml(localize(language, 'traditionalGenerosityBody'))}
                </p>
                <p style="margin: 7px 0 0 0; color: ${theme.accent}; font-size: 10px; font-weight: bold; text-align: center; font-family: Georgia, serif;">
                  ${escapeHtml(localize(language, 'traditionalWelcome'))}
                </p>
              </div>
            </div>`
          : `<div style="display: flex; align-items: center; width: 100%; max-width: 580px; margin: 8px 0 12px;">
              <div style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, ${theme.accent});"></div>
              <span style="color: ${theme.accent}; font-size: 14px; margin: 0 14px;">✦</span>
              <div style="flex: 1; height: 1px; background: linear-gradient(to left, transparent, ${theme.accent});"></div>
            </div>

            <div style="width: 100%; max-width: 580px; text-align: left;">
              <p style="font-size: 9.5px; letter-spacing: 4px; color: ${theme.accent}; text-transform: uppercase; margin: 0 0 8px 0; font-family: Georgia, serif; text-align: center;">
                ${escapeHtml(localize(language, 'pdfProgramAndDressCode'))}
              </p>
              <p style="font-size: 10px; color: ${theme.textSecondary}; margin: 0 0 8px 0; text-align: center; font-family: Georgia, serif;"><strong>👔 ${escapeHtml(localize(language, 'dressCode'))}:</strong> ${escapeHtml(eventData.dressCode)}</p>
              ${scheduleHtml}
            </div>`
      }

      <div style="margin-top: 12px; display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 580px; border-top: 1px solid ${theme.accentSoft}; padding-top: 12px;">
        <div style="text-align: left; font-size: 10px; color: ${theme.textSecondary}; font-family: Georgia, serif; flex: 1; padding-right: 14px;">
          <p style="margin: 2px 0;">
            <strong>${escapeHtml(localize(language, 'pdfGuestCount'))}:</strong> ${guestCount}
          </p>
          <p style="margin: 2px 0;">
            <strong>${escapeHtml(localize(language, 'pdfGenerated'))}:</strong> ${new Date().toLocaleDateString(getLocale(language))}
          </p>
          <p style="margin: 8px 0 0 0; font-size: 8.5px; letter-spacing: 0.5px; color: ${theme.accent}; text-transform: uppercase; line-height: 1.45;">
            ${escapeHtml(localize(language, 'pdfValidIfListed'))}
          </p>
        </div>
        <div style="text-align: center; flex-shrink: 0;">
          <div style="width: 100px; border: 1px solid ${theme.qrBorder}; background: ${theme.qrLight}; padding: 5px; border-radius: 6px;">
            <img src="${qrCodeDataUrl}" alt="QR" style="width: 100%; height: auto; display: block;" />
          </div>
          <p style="margin: 4px 0 0 0; font-size: 8.5px; letter-spacing: 0.8px; text-transform: uppercase; color: ${theme.accent}; font-family: Georgia, serif;">
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
      backgroundColor: theme.canvasBackground,
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
  guestCount: number,
  variant: GuestLogVariant = 'religious'
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://example.com');

  const url = new URL(baseUrl);
  url.pathname = variant === 'traditional' ? '/traditional' : '/';
  url.searchParams.set('checkin', '1');
  url.searchParams.set('invitation', invitationCode);
  url.searchParams.set('hash', verificationHash);
  // Encode guest info directly in the URL so QR works on any device
  url.searchParams.set('guest', btoa(unescape(encodeURIComponent(guestName))));
  url.searchParams.set('count', String(guestCount));
  return url.toString();
}
