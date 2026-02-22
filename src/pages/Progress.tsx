import React, { useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonListHeader,
  IonModal,
  IonPage,
  IonSkeletonText,
  IonTitle,
  IonToast,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { albumsOutline, cameraOutline, closeOutline, imageOutline, swapHorizontalOutline, trash } from 'ionicons/icons';
import { useProgressPhotos, type ProgressPhoto } from '../hooks/useProgressPhotos';
import { useTrends } from '../hooks/useTrends';
import { TrendCharts } from '../components/TrendCharts';
import { formatDuration, today } from '../track/trackUtils';

/* ── helpers ─────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtWater(ml: number | null) {
  if (ml === null) return '—';
  return ml >= 1000 ? `${(ml / 1000).toFixed(1)} L` : `${ml} ml`;
}

/* ── stat card item ──────────────────────────────────────────────── */
const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ textAlign: 'center', flex: 1 }}>
    <div
      style={{
        fontSize: 'var(--md-title-lg)',
        fontFamily: 'var(--md-font)',
        fontWeight: 500,
        color: 'var(--md-primary)',
        lineHeight: 1.2,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: 'var(--md-label-sm)',
        color: 'var(--md-on-surface-variant)',
        marginTop: 2,
      }}
    >
      {label}
    </div>
  </div>
);

/* ── main component ───────────────────────────────────────────────── */
const Progress: React.FC = () => {
  const { photos, loading: photosLoading, addPhoto, deletePhoto, refresh: refreshPhotos } = useProgressPhotos();
  const { trendDays, stats, refresh: refreshTrends } = useTrends(30);

  useIonViewWillEnter(() => {
    refreshPhotos();
    refreshTrends();
  });

  /* Add-photo modal */
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState(today());
  const [addUri, setAddUri] = useState<string | null>(null);
  const addSaving = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const capturePhoto = async (source: CameraSource) => {
    try {
      if (source === CameraSource.Camera) {
        const perms = await Camera.checkPermissions();
        if (perms.camera === 'denied') {
          setErrorMsg('Camera permission denied. Please enable it in device settings.');
          return;
        }
        if (perms.camera !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['camera'] });
          if (req.camera !== 'granted') {
            setErrorMsg('Camera permission was not granted.');
            return;
          }
        }
      } else {
        const perms = await Camera.checkPermissions();
        if (perms.photos === 'denied') {
          setErrorMsg('Photo library permission denied. Please enable it in device settings.');
          return;
        }
        if (perms.photos !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['photos'] });
          if (req.photos !== 'granted') {
            setErrorMsg('Photo library permission was not granted.');
            return;
          }
        }
      }
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source,
        quality: 80,
      });
      if (photo.dataUrl) setAddUri(photo.dataUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('no image')) {
        setErrorMsg('Could not capture photo.');
      }
    }
  };

  const savePhoto = async () => {
    if (!addUri || addSaving.current) return;
    addSaving.current = true;
    try {
      await addPhoto(addDate, addUri);
    } catch {
      setErrorMsg('Could not save photo.');
    } finally {
      addSaving.current = false;
    }
    setShowAdd(false);
    setAddUri(null);
    setAddDate(today());
  };

  /* Gallery expand */
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  /* Compare modal */
  const [showCompare, setShowCompare] = useState(false);
  const [selected, setSelected] = useState<ProgressPhoto[]>([]);
  const [comparing, setComparing] = useState(false);

  const toggleSelect = (photo: ProgressPhoto) => {
    setSelected((prev) => {
      if (prev.some((p) => p.id === photo.id)) {
        return prev.filter((p) => p.id !== photo.id);
      }
      if (prev.length >= 2) return prev;
      return [...prev, photo];
    });
  };

  const openCompare = () => {
    setSelected([]);
    setComparing(false);
    setShowCompare(true);
  };

  const closeCompareModal = () => {
    setShowCompare(false);
    setSelected([]);
    setComparing(false);
  };

  /* ── render ── */
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Progress</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Progress</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div style={{ maxWidth: 520, margin: '0 auto', paddingBottom: 96 }}>

          {/* Stats summary card */}
          <IonCard
            style={{
              margin: '16px 16px 8px',
              borderRadius: 'var(--md-shape-xl)',
              border: '1px solid var(--md-outline-variant)',
              boxShadow: 'none',
            }}
          >
            <IonCardContent>
              <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
                <StatItem
                  label="Current Weight"
                  value={
                    stats.currentWeight !== null
                      ? `${stats.currentWeight} ${stats.currentWeightUnit}`
                      : '—'
                  }
                />
                <StatItem
                  label="7-day Sleep"
                  value={
                    stats.avg7SleepMin !== null
                      ? formatDuration(stats.avg7SleepMin)
                      : '—'
                  }
                />
                <StatItem label="7-day Water" value={fmtWater(stats.avg7WaterMl)} />
              </div>
            </IonCardContent>
          </IonCard>

          {/* Progress photos section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingRight: 16,
            }}
          >
            <IonListHeader
              style={{
                color: 'var(--md-primary)',
                fontSize: 'var(--md-label-lg)',
                letterSpacing: 1,
              }}
            >
              PROGRESS PHOTOS
            </IonListHeader>
            {photos.length >= 2 && (
              <IonButton
                fill="clear"
                size="small"
                style={{ '--color': 'var(--md-secondary)' } as React.CSSProperties}
                onClick={openCompare}
              >
                <IonIcon slot="start" icon={swapHorizontalOutline} />
                Compare
              </IonButton>
            )}
          </div>

          {photosLoading ? (
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '4px 16px 8px',
                overflowX: 'hidden',
              }}
            >
              {[1, 2, 3].map((i) => (
                <IonSkeletonText
                  key={i}
                  animated
                  style={{ width: 140, height: 160, borderRadius: 'var(--md-shape-lg)', flexShrink: 0 }}
                />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 24px',
                color: 'var(--md-on-surface-variant)',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
              <p style={{ margin: 0, fontSize: 'var(--md-body-md)' }}>No photos yet</p>
              <p style={{ margin: '4px 0 0', fontSize: 'var(--md-body-sm)', opacity: 0.65 }}>
                Tap + to add your first progress photo
              </p>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {/* Horizontal scroll row */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  overflowX: 'auto',
                  padding: '4px 16px 8px',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                } as React.CSSProperties}
              >
                {(showAllPhotos ? photos : photos.slice(0, 4)).map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      flexShrink: 0,
                      width: 140,
                      borderRadius: 'var(--md-shape-lg)',
                      overflow: 'hidden',
                      border: '1px solid var(--md-outline-variant)',
                      background: 'var(--md-surface)',
                    }}
                  >
                    <img
                      src={photo.photo_uri}
                      alt={fmtDate(photo.date)}
                      style={{
                        width: 140,
                        height: 140,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    <div
                      style={{
                        padding: '5px 8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--md-label-sm)',
                          color: 'var(--md-on-surface-variant)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 90,
                        }}
                      >
                        {fmtDate(photo.date)}
                      </span>
                      <IonIcon
                        icon={trash}
                        style={{ fontSize: 15, color: 'var(--md-error)', cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => deletePhoto(photo.id)}
                      />
                    </div>
                  </div>
                ))}

                {/* Show-more tile — only when collapsed and more than 4 photos */}
                {!showAllPhotos && photos.length > 4 && (
                  <div
                    onClick={() => setShowAllPhotos(true)}
                    style={{
                      flexShrink: 0,
                      width: 140,
                      height: 140 + 32, // image + label row
                      borderRadius: 'var(--md-shape-lg)',
                      border: '1px dashed var(--md-outline-variant)',
                      background: 'var(--md-surface-variant)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 500,
                        color: 'var(--md-primary)',
                        fontFamily: 'var(--md-font)',
                      }}
                    >
                      +{photos.length - 4}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--md-label-sm)',
                        color: 'var(--md-on-surface-variant)',
                      }}
                    >
                      Show all
                    </span>
                  </div>
                )}
              </div>

              {/* Collapse button — shown when expanded and more than 4 photos */}
              {showAllPhotos && photos.length > 4 && (
                <div style={{ textAlign: 'center', paddingBottom: 4 }}>
                  <IonButton
                    fill="clear"
                    size="small"
                    style={{ '--color': 'var(--md-on-surface-variant)', fontSize: 'var(--md-label-sm)' } as React.CSSProperties}
                    onClick={() => setShowAllPhotos(false)}
                  >
                    Show less
                  </IonButton>
                </div>
              )}
            </div>
          )}

          {/* Trend charts */}
          <IonListHeader
            style={{
              color: 'var(--md-primary)',
              fontSize: 'var(--md-label-lg)',
              letterSpacing: 1,
              marginTop: 8,
            }}
          >
            TRENDS — LAST 30 DAYS
          </IonListHeader>
          <div style={{ padding: '8px 16px 0' }}>
            <TrendCharts days={trendDays} />
          </div>
        </div>

        {/* FAB */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton
            style={
              {
                '--background': 'var(--md-primary-container)',
                '--color': 'var(--md-on-primary-container)',
              } as React.CSSProperties
            }
            onClick={() => setShowAdd(true)}
          >
            <IonIcon icon={imageOutline} />
          </IonFabButton>
        </IonFab>

        <IonToast
          isOpen={!!errorMsg}
          message={errorMsg ?? ''}
          duration={3000}
          color="danger"
          onDidDismiss={() => setErrorMsg(null)}
        />

        {/* Add-photo modal */}
        <IonModal
          isOpen={showAdd}
          onDidDismiss={() => { setShowAdd(false); setAddUri(null); }}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add Progress Photo</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => { setShowAdd(false); setAddUri(null); }}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div style={{ padding: '24px 20px' }}>
              <IonItem lines="none" style={{ marginBottom: 16 }}>
                <IonLabel position="stacked" style={{ color: 'var(--md-on-surface-variant)', marginBottom: 6 }}>
                  Date
                </IonLabel>
                <input
                  type="date"
                  value={addDate}
                  max={today()}
                  onChange={(e) => setAddDate(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 'var(--md-body-lg)',
                    color: 'var(--md-on-surface)',
                    fontFamily: 'var(--md-font)',
                    width: '100%',
                    padding: '4px 0',
                  }}
                />
              </IonItem>

              {/* Preview */}
              {addUri ? (
                <div
                  style={{
                    borderRadius: 'var(--md-shape-lg)',
                    overflow: 'hidden',
                    marginBottom: 20,
                    border: '1px solid var(--md-outline-variant)',
                    background: 'var(--md-surface-variant)',
                  }}
                >
                  <img
                    src={addUri}
                    alt="Preview"
                    style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    borderRadius: 'var(--md-shape-lg)',
                    border: '2px dashed var(--md-outline-variant)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 140,
                    marginBottom: 20,
                    background: 'var(--md-surface-variant)',
                  }}
                >
                  <IonIcon
                    icon={imageOutline}
                    style={{ fontSize: 36, color: 'var(--md-on-surface-variant)', marginBottom: 8 }}
                  />
                  <span style={{ fontSize: 'var(--md-body-sm)', color: 'var(--md-on-surface-variant)' }}>
                    No photo selected
                  </span>
                </div>
              )}

              {/* Source buttons */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  style={{
                    flex: 1,
                    '--border-radius': 'var(--md-shape-full)',
                    '--border-color': 'var(--md-outline)',
                    '--color': 'var(--md-on-surface)',
                  } as React.CSSProperties}
                  onClick={() => capturePhoto(CameraSource.Camera)}
                >
                  <IonIcon slot="start" icon={cameraOutline} />
                  Take Photo
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  style={{
                    flex: 1,
                    '--border-radius': 'var(--md-shape-full)',
                    '--border-color': 'var(--md-outline)',
                    '--color': 'var(--md-on-surface)',
                  } as React.CSSProperties}
                  onClick={() => capturePhoto(CameraSource.Photos)}
                >
                  <IonIcon slot="start" icon={albumsOutline} />
                  Gallery
                </IonButton>
              </div>

              <IonButton
                expand="block"
                disabled={!addUri}
                style={
                  {
                    '--border-radius': 'var(--md-shape-full)',
                    '--background': 'var(--md-primary)',
                    '--color': 'var(--md-on-primary)',
                  } as React.CSSProperties
                }
                onClick={savePhoto}
              >
                Save Photo
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Compare modal */}
        <IonModal
          isOpen={showCompare}
          onDidDismiss={closeCompareModal}
          breakpoints={[0, 1]}
          initialBreakpoint={1}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{comparing ? 'Side by Side' : 'Select 2 Photos'}</IonTitle>
              <IonButtons slot="start">
                {comparing ? (
                  <IonButton onClick={() => setComparing(false)}>Back</IonButton>
                ) : (
                  <IonButton onClick={closeCompareModal}>
                    <IonIcon icon={closeOutline} />
                  </IonButton>
                )}
              </IonButtons>
              {!comparing && (
                <IonButtons slot="end">
                  <IonButton
                    disabled={selected.length !== 2}
                    onClick={() => setComparing(true)}
                    style={{ '--color': 'var(--md-primary)' } as React.CSSProperties}
                  >
                    Compare
                  </IonButton>
                </IonButtons>
              )}
            </IonToolbar>
          </IonHeader>
          <IonContent>
            {comparing ? (
              <div style={{ display: 'flex', height: '100%', gap: 2 }}>
                {selected.map((photo) => (
                  <div
                    key={photo.id}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <img
                      src={photo.photo_uri}
                      alt={fmtDate(photo.date)}
                      style={{ width: '100%', flex: 1, objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '8px 4px',
                        fontSize: 'var(--md-label-md)',
                        color: 'var(--md-on-surface)',
                        background: 'var(--md-surface)',
                      }}
                    >
                      {fmtDate(photo.date)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 16 }}>
                <p
                  style={{
                    margin: '0 0 16px',
                    fontSize: 'var(--md-body-sm)',
                    color: 'var(--md-on-surface-variant)',
                    textAlign: 'center',
                  }}
                >
                  {selected.length === 0
                    ? 'Select the first photo'
                    : selected.length === 1
                    ? 'Select the second photo'
                    : 'Both selected — tap Compare'}
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                  }}
                >
                  {photos.map((photo) => {
                    const isSelected = selected.some((p) => p.id === photo.id);
                    const isDisabled = selected.length >= 2 && !isSelected;
                    return (
                      <div
                        key={photo.id}
                        onClick={() => { if (!isDisabled) toggleSelect(photo); }}
                        style={{
                          borderRadius: 'var(--md-shape-lg)',
                          overflow: 'hidden',
                          border: `2px solid ${isSelected ? 'var(--md-primary)' : 'var(--md-outline-variant)'}`,
                          opacity: isDisabled ? 0.4 : 1,
                          cursor: isDisabled ? 'default' : 'pointer',
                          position: 'relative',
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 6,
                              right: 6,
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'var(--md-primary)',
                              color: 'var(--md-on-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 700,
                              zIndex: 1,
                            }}
                          >
                            {selected.findIndex((p) => p.id === photo.id) + 1}
                          </div>
                        )}
                        <img
                          src={photo.photo_uri}
                          alt={fmtDate(photo.date)}
                          style={{
                            width: '100%',
                            aspectRatio: '1/1',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <div
                          style={{
                            padding: '4px 8px 6px',
                            fontSize: 'var(--md-label-sm)',
                            color: 'var(--md-on-surface-variant)',
                            textAlign: 'center',
                          }}
                        >
                          {fmtDate(photo.date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Progress;
