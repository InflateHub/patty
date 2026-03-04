import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonAlert,
} from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { calendarOutline, cameraOutline, createOutline, imageOutline, trash } from 'ionicons/icons';
import { WeightChart } from '../components/WeightChart';
import { useWeightLog } from '../hooks/useWeightLog';
import type { WeightEntry } from '../hooks/useWeightLog';
import { S, today, formatDate, formatTime, isToday } from './trackUtils';

/* ── PhotoMarquee ────────────────────────────────────────────────── */
const PhotoMarquee: React.FC<{
  entries: WeightEntry[];
  onTap: (uri: string) => void;
}> = ({ entries, onTap }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  // Chronological order (oldest → newest) for delta calculation
  const recent = useMemo(() => [...entries].slice(0, 7).reverse(), [entries]);
  if (recent.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 2px 8px', scrollbarWidth: 'none' } as React.CSSProperties}>
      {recent.map((entry, idx) => {
        const isEntryToday = entry.date === todayStr;
        // Compute delta from previous entry (only from 2nd entry onwards)
        const prev = idx > 0 ? recent[idx - 1] : null;
        const delta = prev && prev.unit === entry.unit
          ? Math.round((entry.value - prev.value) * 10) / 10
          : null;
        const deltaColor = delta === null ? undefined : delta > 0 ? '#ef4444' : delta < 0 ? '#22c55e' : '#aaa';
        return (
          <div
            key={entry.id}
            style={{
              flex: '0 0 auto', width: 72, height: 80,
              borderRadius: 'var(--md-shape-md)',
              overflow: 'hidden', position: 'relative',
              outline: isEntryToday ? '2.5px solid var(--md-primary)' : 'none',
              outlineOffset: isEntryToday ? 2 : 0,
              background: 'var(--md-surface-container)',
              cursor: entry.photo_uri ? 'pointer' : 'default',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={() => entry.photo_uri && onTap(entry.photo_uri)}
          >
            {/* Photo or emoji placeholder */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              {entry.photo_uri ? (
                <img src={entry.photo_uri} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, opacity: 0.35 }}>
                  &#9878;&#65039;
                </div>
              )}
              {/* Weight value chip at bottom of photo area */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.52)', padding: '2px 4px',
                textAlign: 'center', fontSize: 10, fontFamily: 'var(--md-font)',
                color: '#fff', fontWeight: 600,
              }}>
                {entry.value} {entry.unit}
              </div>
            </div>
            {/* Delta row — only shown from 2nd entry */}
            <div style={{
              height: 18, background: 'var(--md-surface-container-high)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontFamily: 'var(--md-font)', fontWeight: 700,
              color: deltaColor ?? 'transparent',
              flexShrink: 0,
            }}>
              {delta !== null
                ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`
                : '\u00a0'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

interface WeightTabProps {
  openTrigger?: number;
}

export const WeightTab: React.FC<WeightTabProps> = ({ openTrigger }) => {
  const { entries, latestEntry, loading, addEntry, deleteEntry } = useWeightLog();
  const modal = useRef<HTMLIonModalElement>(null);
  const dateModal = useRef<HTMLIonModalElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
  const [date, setDate] = useState<string>(today());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [step, setStep] = useState<'entry' | 'photo'>('entry');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [photoViewUri, setPhotoViewUri] = useState<string | null>(null);

  const [presentAlert] = useIonAlert();

  /* Open modal when Track's contextual FAB fires */
  useEffect(() => {
    if (!openTrigger) return;
    setModalOpen(true);
  }, [openTrigger]);

  function resetWeightForm() {
    setValue('');
    setUnit('kg');
    setDate(today());
    setNote('');
    setStep('entry');
    setPhotoUri(null);
  }

  /** Step 1 validate â†’ advance to photo step */
  async function handleAdvanceToPhoto() {
    const num = parseFloat(value);
    if (!value || isNaN(num) || num <= 0) {
      await presentAlert({ header: 'Invalid value', message: 'Please enter a positive number.', buttons: ['OK'] });
      return;
    }
    setStep('photo');
  }

  /** Capture photo from camera or gallery */
  async function capturePhoto(source: CameraSource) {
    try {
      if (source === CameraSource.Camera) {
        const perms = await Camera.checkPermissions();
        if (perms.camera === 'denied') {
          setErrorMsg('Camera permission denied. Please enable it in device settings.');
          return;
        }
        if (perms.camera !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['camera'] });
          if (req.camera !== 'granted') { setErrorMsg('Camera permission not granted.'); return; }
        }
      } else {
        const perms = await Camera.checkPermissions();
        if (perms.photos === 'denied') {
          setErrorMsg('Photo library permission denied. Please enable it in device settings.');
          return;
        }
        if (perms.photos !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['photos'] });
          if (req.photos !== 'granted') { setErrorMsg('Photo library permission not granted.'); return; }
        }
      }
      const photo = await Camera.getPhoto({ resultType: CameraResultType.DataUrl, source, quality: 80 });
      if (photo.dataUrl) setPhotoUri(photo.dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('no image')) {
        setErrorMsg('Could not capture photo.');
      }
    }
  }

  /** Step 2: save (photo is optional) */
  async function handleWeightSave() {
    const num = parseFloat(value);
    setSaving(true);
    try {
      await addEntry({
        date,
        value: num,
        unit,
        note: note.trim() || undefined,
        photo_path: photoUri ?? undefined, // optional: may be null
      });
      resetWeightForm();
      setModalOpen(false);
    } catch {
      setErrorMsg('Could not save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleWeightDelete(id: string) {
    presentAlert({
      header: 'Delete entry',
      message: 'Remove this weight entry?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            try { await deleteEntry(id); }
            catch { setErrorMsg('Could not delete entry.'); }
          },
        },
      ],
    });
  }

  const delta = useMemo(() => {
    if (!latestEntry || entries.length < 2) return null;
    const prev = entries[1];
    if (!prev || prev.unit !== latestEntry.unit) return null;
    return Math.round((latestEntry.value - prev.value) * 10) / 10;
  }, [latestEntry, entries]);

  return (
    <>
      {/* â”€â”€ Loading skeleton â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Loading skeleton */}
      {loading && (
        <IonCard>
          <IonCardContent>
            <IonSkeletonText animated style={{ width: 140, height: 56, margin: '16px auto 12px', borderRadius: 8 }} />
            <IonSkeletonText animated style={{ width: '100%', height: 72, borderRadius: 8 }} />
          </IonCardContent>
        </IonCard>
      )}

      {/* â”€â”€ Today stat card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Hero stat card */}
      {!loading && (
        <IonCard>
          <IonCardContent>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Weight
              </span>
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'var(--md-surface-variant)', border: 'none',
                  borderRadius: 'var(--md-shape-full)', padding: '6px 14px',
                  fontSize: 'var(--md-label-md)', fontFamily: 'var(--md-font)',
                  color: 'var(--md-on-surface-variant)', cursor: 'pointer',
                }}
              >
                <IonIcon icon={createOutline} style={{ fontSize: 14 }} />
                {latestEntry ? 'Log / Edit' : 'Log weight'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <span style={{ fontSize: 56, fontWeight: 300, fontFamily: 'var(--md-font)', color: latestEntry ? 'var(--md-on-surface)' : 'var(--md-outline)', lineHeight: 1 }}>
                {latestEntry ? `${latestEntry.value}` : '\u2014'}
              </span>
              {latestEntry && (
                <div style={{ paddingBottom: 6 }}>
                  <span style={{ fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                    {latestEntry.unit}
                  </span>
                  {delta !== null && (
                    <div style={{ fontSize: 'var(--md-label-sm)', fontFamily: 'var(--md-font)', fontWeight: 600, color: delta > 0 ? 'var(--md-error)' : delta < 0 ? 'var(--md-primary)' : 'var(--md-on-surface-variant)' }}>
                      {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} {latestEntry.unit}
                    </div>
                  )}
                </div>
              )}
            </div>
            {latestEntry && (
              <div style={{ marginTop: 6, fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)' }}>
                {isToday(latestEntry.date) ? 'Today' : formatDate(latestEntry.date)}
                {latestEntry.note && <span> &middot; {latestEntry.note}</span>}
              </div>
            )}
            {entries.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <PhotoMarquee entries={entries} onTap={(uri) => setPhotoViewUri(uri)} />
              </div>
            )}
          </IonCardContent>
        </IonCard>
      )}

      {/* â”€â”€ Trend chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {!loading && entries.length > 0 && (
        <IonCard>
          <IonCardContent style={{ paddingTop: 16 }}>
            <WeightChart entries={entries} />
          </IonCardContent>
        </IonCard>
      )}

      {/* Collapsible history */}
      {!loading && entries.length > 0 && (
        <IonCard style={{ marginBottom: 80 }}>
          <IonCardContent style={{ padding: '0 0 4px' }}>
            <button
              onClick={() => setShowHistory((h) => !h)}
              style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', padding: '14px 16px', fontSize: 'var(--md-label-lg)', fontFamily: 'var(--md-font)', color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '.08em', cursor: 'pointer' }}
            >
              All History ({entries.length})
              <span style={{ fontSize: 18, display: 'inline-block', transition: 'transform 200ms', transform: showHistory ? 'rotate(180deg)' : 'none' }}>&#8964;</span>
            </button>
            {showHistory && (
              <>
                <IonList lines="inset" style={{ margin: 0, padding: 0 }}>
                  {entries.slice(0, visibleCount).map((entry: WeightEntry) => (
                    <IonItemSliding key={entry.id}>
                      <IonItem>
                        {entry.photo_uri ? (
                          <img slot="start" src={entry.photo_uri} alt="" onClick={(e) => { e.stopPropagation(); if (entry.photo_uri) setPhotoViewUri(entry.photo_uri); }} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', cursor: 'pointer' }} />
                        ) : (
                          <div slot="start" style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--md-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, opacity: 0.4 }}>&#9878;&#65039;</div>
                        )}
                        <IonLabel>
                          <h3 style={{ fontFamily: 'var(--md-font)' }}>{entry.value} {entry.unit}</h3>
                          {entry.note && <p style={{ fontFamily: 'var(--md-font)' }}>{entry.note}</p>}
                        </IonLabel>
                        <IonNote slot="end" style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--md-font)' }}>{isToday(entry.date) ? 'Today' : formatDate(entry.date)}</div>
                          {entry.created_at && <div style={{ fontSize: 'var(--md-label-sm)', opacity: 0.7, fontFamily: 'var(--md-font)' }}>{formatTime(entry.created_at)}</div>}
                        </IonNote>
                      </IonItem>
                      <IonItemOptions side="end">
                        <IonItemOption color="danger" onClick={() => handleWeightDelete(entry.id)}>
                          <IonIcon slot="icon-only" icon={trash} />
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  ))}
                </IonList>
                <IonInfiniteScroll disabled={visibleCount >= entries.length} onIonInfinite={(ev) => { setVisibleCount((c) => c + 30); setTimeout(() => (ev.target as HTMLIonInfiniteScrollElement).complete(), 300); }}>
                  <IonInfiniteScrollContent loadingText="Loading more..." />
                </IonInfiniteScroll>
              </>
            )}
          </IonCardContent>
        </IonCard>
      )}

      {!loading && entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 32px', color: 'var(--md-on-surface-variant)' }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>&#9878;&#65039;</div>
          <p style={{ margin: 0, fontSize: 'var(--md-body-lg)', fontWeight: 500, fontFamily: 'var(--md-font)' }}>No entries yet</p>
          <p style={{ margin: '8px 0 0', fontSize: 'var(--md-body-sm)', fontFamily: 'var(--md-font)' }}>Tap + to log your first weight entry.</p>
        </div>
      )}

      <IonToast isOpen={!!errorMsg} message={errorMsg ?? ''} duration={3500} color="danger" onDidDismiss={() => setErrorMsg(null)} />

      {/* Full-screen photo viewer */}
      <IonModal isOpen={!!photoViewUri} onDidDismiss={() => setPhotoViewUri(null)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Photo</IonTitle>
            <IonButtons slot="end"><IonButton onClick={() => setPhotoViewUri(null)}>Done</IonButton></IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            {photoViewUri && <img src={photoViewUri} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />}
          </div>
        </IonContent>
      </IonModal>
      <IonModal
        ref={modal}
        isOpen={modalOpen}
        onDidDismiss={() => { setModalOpen(false); resetWeightForm(); }}
        initialBreakpoint={step === 'photo' ? 0.65 : 0.72}
        breakpoints={[0, 0.65, 0.72, 1]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              {step === 'photo'
                ? <IonButton onClick={() => setStep('entry')}>Back</IonButton>
                : <IonButton onClick={() => setModalOpen(false)}>Cancel</IonButton>
              }
            </IonButtons>
            <IonTitle>{step === 'photo' ? 'Add Photo' : 'Log Weight'}</IonTitle>
            <IonButtons slot="end">
              {step === 'entry'
                ? <IonButton strong onClick={handleAdvanceToPhoto}>Next</IonButton>
                : <IonButton strong onClick={handleWeightSave} disabled={saving}>Save</IonButton>
              }
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {step === 'entry' && (
            <>
              <div style={S.valueArea}>
                <input
                  autoFocus
                  type="number"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={S.valueInput}
                />
                <div style={S.unitRow}>
                  {(['kg', 'lbs'] as const).map((u) => (
                    <button key={u} style={S.unitChip(unit === u)} onClick={() => setUnit(u)}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div style={S.divider} />

              <div style={S.row} onClick={() => setDateModalOpen(true)}>
                <IonIcon icon={calendarOutline} style={S.rowIcon} />
                <span style={S.rowText}>{isToday(date) ? 'Today' : formatDate(date)}</span>
                <span style={S.rowHint}>{isToday(date) ? formatDate(date) : ''}</span>
              </div>

              <div style={S.divider} />

              <div style={{ ...S.row, cursor: 'text', alignItems: 'flex-start' }}>
                <IonIcon icon={createOutline} style={{ ...S.rowIcon, marginTop: 2 }} />
                <textarea
                  rows={1}
                  placeholder="Add a note…"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  style={S.noteInput}
                />
              </div>

              <div style={S.divider} />
            </>
          )}

          {step === 'photo' && (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <p style={{
                margin: 0,
                fontSize: 'var(--md-body-md)',
                fontFamily: 'var(--md-font)',
                color: 'var(--md-on-surface-variant)',
                textAlign: 'center',
              }}>
                Add a progress photo (optional) — it powers your timeline in Achievements.
              </p>

              {photoUri ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <img
                    src={photoUri}
                    alt="Preview"
                    style={{ width: '100%', borderRadius: 16, objectFit: 'cover', maxHeight: 240, display: 'block' }}
                  />
                  <button
                    onClick={() => setPhotoUri(null)}
                    style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'rgba(0,0,0,0.55)', color: '#fff',
                      border: 'none', borderRadius: 20, padding: '4px 10px',
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                  <button
                    style={{
                      flex: 1, padding: '16px 0', borderRadius: 'var(--md-shape-lg)',
                      background: 'var(--md-primary-container)',
                      color: 'var(--md-on-primary-container)',
                      border: 'none', cursor: 'pointer',
                      fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}
                    onClick={() => capturePhoto(CameraSource.Camera)}
                  >
                    <IonIcon icon={cameraOutline} style={{ fontSize: 28 }} />
                    Take Photo
                  </button>
                  <button
                    style={{
                      flex: 1, padding: '16px 0', borderRadius: 'var(--md-shape-lg)',
                      background: 'var(--md-secondary-container)',
                      color: 'var(--md-on-secondary-container)',
                      border: 'none', cursor: 'pointer',
                      fontSize: 'var(--md-body-md)', fontFamily: 'var(--md-font)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}
                    onClick={() => capturePhoto(CameraSource.Photos)}
                  >
                    <IonIcon icon={imageOutline} style={{ fontSize: 28 }} />
                    Gallery
                  </button>
                </div>
              )}
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* â”€â”€ Date picker sub-modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <IonModal
        ref={dateModal}
        isOpen={dateModalOpen}
        onDidDismiss={() => setDateModalOpen(false)}
        initialBreakpoint={0.55}
        breakpoints={[0, 0.55]}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Pick Date</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={() => setDateModalOpen(false)}>Done</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonDatetime
            presentation="date"
            value={date}
            onIonChange={(e) => {
              const val = Array.isArray(e.detail.value) ? e.detail.value[0] : e.detail.value;
              setDate((val ?? today()).slice(0, 10));
            }}
            style={{ width: '100%', '--background': 'transparent' } as React.CSSProperties}
          />
        </IonContent>
      </IonModal>
    </>
  );
};
