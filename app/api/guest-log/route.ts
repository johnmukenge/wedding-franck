import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { get, put } from '@vercel/blob';

type Language = 'en' | 'fr';
type GuestLogVariant = 'religious' | 'traditional';

type GuestData = {
  firstName: string;
  lastName: string;
  attendanceType: 'single' | 'couple';
  partnerFirstName?: string;
  partnerLastName?: string;
};

type GuestLogEntry = GuestData & {
  id: string;
  language: Language;
  pdfFileName: string;
  invitationCode: string;
  verificationHash: string;
  attendanceCount: number;
  status: 'confirmed';
  checkInStatus: 'pending' | 'checked-in';
  createdAt: string;
};

type GuestCheckInResult = 'checked-in' | 'already-checked-in' | 'not-found';

type GuestLogConfig = {
  blobFileName: string;
  filePathEnvKey: string;
  tmpFilePath: string;
};

export const runtime = 'nodejs';

const DEFAULT_VARIANT: GuestLogVariant = 'religious';
const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

const getAccessCookieName = (variant: GuestLogVariant = DEFAULT_VARIANT) =>
  variant === 'traditional' ? 'traditional_guest_log_access' : 'guest_log_access';

const getAccessCode = (variant: GuestLogVariant = DEFAULT_VARIANT) => {
  if (variant === 'traditional') {
    return (
      (process.env.TRADITIONAL_GUEST_LOG_ACCESS_CODE || process.env.GUEST_LOG_ACCESS_CODE || '').trim()
    );
  }

  return (process.env.GUEST_LOG_ACCESS_CODE || '').trim();
};

const getCookieSecret = () =>
  process.env.GUEST_LOG_COOKIE_SECRET || process.env.GUEST_LOG_ACCESS_CODE || 'dev-guest-log-secret';

function signPayload(payload: string) {
  return crypto.createHmac('sha256', getCookieSecret()).update(payload).digest('hex');
}

function buildAccessToken(variant: GuestLogVariant = DEFAULT_VARIANT) {
  const expiresAt = Date.now() + ACCESS_COOKIE_MAX_AGE_SECONDS * 1000;
  const payload = `${variant}|${expiresAt}`;
  const signature = signPayload(payload);
  const encodedPayload = Buffer.from(payload, 'utf-8').toString('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyAccessToken(token: string, variant: GuestLogVariant = DEFAULT_VARIANT) {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  let payload = '';

  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
  } catch {
    return false;
  }

  const expectedSignature = signPayload(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return false;
  }

  const [tokenVariant, expiresAtRaw] = payload.split('|');
  const expiresAt = Number(expiresAtRaw);

  if ((tokenVariant as GuestLogVariant) !== variant) return false;
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  return true;
}

function hasServerAccess(request: NextRequest, variant: GuestLogVariant = DEFAULT_VARIANT) {
  const token = request.cookies.get(getAccessCookieName(variant))?.value;
  if (!token) return false;
  return verifyAccessToken(token, variant);
}

const getGuestLogConfig = (variant: GuestLogVariant = DEFAULT_VARIANT): GuestLogConfig => {
  if (variant === 'traditional') {
    return {
      blobFileName: 'traditional-guest-log.json',
      filePathEnvKey: 'TRADITIONAL_GUEST_LOG_FILE_PATH',
      tmpFilePath: '/tmp/traditional-guest-log.json',
    };
  }

  return {
    blobFileName: 'guest-log.json',
    filePathEnvKey: 'GUEST_LOG_FILE_PATH',
    tmpFilePath: '/tmp/guest-log.json',
  };
};

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const resolveLocalFilePath = (variant: GuestLogVariant = DEFAULT_VARIANT) => {
  const config = getGuestLogConfig(variant);
  const envValue = process.env[config.filePathEnvKey];
  if (envValue) return envValue;
  if (process.env.VERCEL) return config.tmpFilePath;
  return path.join(process.cwd(), 'data', config.blobFileName);
};

async function readEntriesFromBlob(variant: GuestLogVariant = DEFAULT_VARIANT): Promise<GuestLogEntry[]> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return [];

  try {
    const blob = await get(getGuestLogConfig(variant).blobFileName, {
      access: 'private',
      token,
      useCache: false,
    });

    if (!blob || blob.statusCode !== 200 || !blob.stream) return [];

    const raw = await new Response(blob.stream).text();
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as GuestLogEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeEntriesToBlob(entries: GuestLogEntry[], variant: GuestLogVariant = DEFAULT_VARIANT) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');

  await put(getGuestLogConfig(variant).blobFileName, JSON.stringify(entries, null, 2), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    token,
  });
}

async function readEntriesFromFile(variant: GuestLogVariant = DEFAULT_VARIANT): Promise<GuestLogEntry[]> {
  try {
    const raw = await fs.readFile(resolveLocalFilePath(variant), 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as GuestLogEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeEntriesToFile(entries: GuestLogEntry[], variant: GuestLogVariant = DEFAULT_VARIANT) {
  const filePath = resolveLocalFilePath(variant);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
}

async function readEntries(variant: GuestLogVariant = DEFAULT_VARIANT): Promise<GuestLogEntry[]> {
  if (useBlob()) return readEntriesFromBlob(variant);
  return readEntriesFromFile(variant);
}

async function writeEntries(entries: GuestLogEntry[], variant: GuestLogVariant = DEFAULT_VARIANT) {
  if (useBlob()) {
    try {
      await writeEntriesToBlob(entries, variant);
      return;
    } catch (error) {
      if (!process.env.VERCEL) {
        await writeEntriesToFile(entries, variant);
        return;
      }

      throw error;
    }
  }

  await writeEntriesToFile(entries, variant);
}

function normalize(value: string) {
  return value.trim().toUpperCase();
}

export async function GET(request: NextRequest) {
  const variant = (new URL(request.url).searchParams.get('variant') === 'traditional'
    ? 'traditional'
    : 'religious') as GuestLogVariant;

  if (!hasServerAccess(request, variant)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const entries = await readEntries(variant);

  return NextResponse.json({
    entries,
    variant,
    storage: useBlob() ? 'blob' : process.env.VERCEL ? 'tmp-file' : 'local-file',
  });
}

export async function POST(request: NextRequest) {
  const parsedBody = (await request.json()) as
    | {
      action?: 'add' | 'find' | 'checkin' | 'import' | 'unlock';
        variant?: GuestLogVariant;
        guestData?: GuestData;
        language?: Language;
        invitationData?: {
          fileName: string;
          invitationCode: string;
          verificationHash: string;
        };
        invitationCode?: string;
        verificationHash?: string;
        incoming?: GuestLogEntry[];
        coupleFormat?: boolean;
        accessCode?: string;
      }
    | undefined;

  const body = parsedBody || {};
  const variant = body.variant === 'traditional' ? 'traditional' : 'religious';
  const entries = await readEntries(variant);

  if (body.action === 'unlock' && body.accessCode) {
    const expectedCode = getAccessCode(variant);
    if (!expectedCode || body.accessCode.trim() !== expectedCode) {
      return NextResponse.json({ accessGranted: false }, { status: 401 });
    }

    const response = NextResponse.json({ accessGranted: true, variant });
    response.cookies.set({
      name: getAccessCookieName(variant),
      value: buildAccessToken(variant),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  }

  if (body.action === 'add' && body.guestData && body.language && body.invitationData) {
    const attendanceCount = body.guestData.attendanceType === 'couple' ? 2 : 1;
    const normalizedCode = normalize(body.invitationData.invitationCode);
    const normalizedHash = normalize(body.invitationData.verificationHash);

    const existing = entries.find(
      (entry) =>
        normalize(entry.invitationCode) === normalizedCode &&
        normalize(entry.verificationHash) === normalizedHash
    );

    if (!existing) {
      // For couple format, create TWO separate entries with same invitation code/hash
      if (body.coupleFormat && body.guestData.attendanceType === 'couple') {
        const entry1: GuestLogEntry = {
          firstName: body.guestData.firstName,
          lastName: body.guestData.lastName,
          attendanceType: 'single',
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          language: body.language,
          pdfFileName: body.invitationData.fileName,
          invitationCode: body.invitationData.invitationCode,
          verificationHash: body.invitationData.verificationHash,
          attendanceCount: 1,
          status: 'confirmed',
          checkInStatus: 'pending',
          createdAt: new Date().toISOString(),
        };

        const entry2: GuestLogEntry = {
          firstName: body.guestData.partnerFirstName || body.guestData.firstName,
          lastName: body.guestData.partnerLastName || body.guestData.lastName,
          attendanceType: 'single',
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          language: body.language,
          pdfFileName: body.invitationData.fileName,
          invitationCode: body.invitationData.invitationCode,
          verificationHash: body.invitationData.verificationHash,
          attendanceCount: 1,
          status: 'confirmed',
          checkInStatus: 'pending',
          createdAt: new Date().toISOString(),
        };

        entries.unshift(entry1, entry2);
      } else {
        // Standard entry (single or couple type with separate name fields)
        const entry: GuestLogEntry = {
          ...body.guestData,
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          language: body.language,
          pdfFileName: body.invitationData.fileName,
          invitationCode: body.invitationData.invitationCode,
          verificationHash: body.invitationData.verificationHash,
          attendanceCount,
          status: 'confirmed',
          checkInStatus: 'pending',
          createdAt: new Date().toISOString(),
        };

        entries.unshift(entry);
      }
      
      await writeEntries(entries, variant);
    }

    return NextResponse.json({ entries, variant });
  }

  if (body.action === 'find' && body.invitationCode && body.verificationHash) {
    const normalizedCode = normalize(body.invitationCode);
    const normalizedHash = normalize(body.verificationHash);

    const entry =
      entries.find(
        (guest) =>
          normalize(guest.invitationCode) === normalizedCode &&
          normalize(guest.verificationHash) === normalizedHash
      ) || null;

    return NextResponse.json({ entry, variant });
  }

  if (body.action === 'checkin' && body.invitationCode && body.verificationHash) {
    if (!hasServerAccess(request, variant)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const normalizedCode = normalize(body.invitationCode);
    const normalizedHash = normalize(body.verificationHash);

    const index = entries.findIndex(
      (guest) =>
        normalize(guest.invitationCode) === normalizedCode &&
        normalize(guest.verificationHash) === normalizedHash
    );

    let result: GuestCheckInResult = 'not-found';

    if (index !== -1) {
      if (entries[index].checkInStatus === 'checked-in') {
        result = 'already-checked-in';
      } else {
        entries[index] = {
          ...entries[index],
          checkInStatus: 'checked-in',
        };

        await writeEntries(entries, variant);
        result = 'checked-in';
      }
    }

    return NextResponse.json({ result, entries, variant });
  }

  if (body.action === 'import' && Array.isArray(body.incoming)) {
    if (!hasServerAccess(request, variant)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingCodes = new Set(entries.map((entry) => entry.invitationCode));
    const toAdd = body.incoming.filter((entry) => !existingCodes.has(entry.invitationCode));
    const updated = [...toAdd, ...entries];

    await writeEntries(updated, variant);

    return NextResponse.json({
      entries: updated,
      added: toAdd.length,
      skipped: body.incoming.length - toAdd.length,
      variant,
    });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
