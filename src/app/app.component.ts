import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

type Step = 'smile' | 'mood' | 'story' | 'date' | 'done';

@Component({
  selector: 'app-root', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html', styleUrl: './app.component.css'
})
export class AppComponent implements OnDestroy {
  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;
  entered = false;
  transitioning = false;
  modalOpen = false;
  step: Step = 'smile';
  cameraReady = false;
  cameraError = '';
  smilePercent = 0;
  smilePassed = false;
  isMusicPlaying = false;
  selectedMood: 'baik' | 'sedih' | '' = '';
  story = '';
  selectedDate = '';
  minDate = '';
  maxDate = '';
  dateError = '';
  sending = false;
  private stream?: MediaStream;
  private landmarker?: FaceLandmarker;
  private animationFrame = 0;
  private lastVideoTime = -1;
  private faceModelLoading = false;
  private flowerAudio = new Audio('assets/music/flower-music.mp3');


  // Ganti dengan nomor WhatsApp tujuan, format internasional tanpa +, spasi, atau strip.
  // Contoh Indonesia: 6281234567890
  whatsappNumber = '6289613730876';
  readonly mapUrl = 'https://www.google.com/maps/place/vilo+cimanggis/data=!4m2!3m1!1s0x2e69eb8711052cd9:0xa6da2c00ad184e1b?sa=X&ved=1t:242&ictx=111';

  constructor() {
    const today = new Date();
    this.minDate = this.toLocalDate(today);
    const max = new Date(today); max.setDate(max.getDate() + 30);
    this.maxDate = this.toLocalDate(max);
  }


  enterWorld(): void {
    if (this.transitioning || this.entered) return;

    this.transitioning = true;

    const audio = new Audio('assets/music/alonica.mp3');
    audio.loop = true;
    audio.volume = 0.5;

    void audio.play().catch(error => {
      console.error('Musik gagal diputar:', error);
    });

    window.setTimeout(() => {
      this.entered = true;
      this.transitioning = false;
    }, 1500);
  }

  async startCamera(): Promise<void> {
    this.cameraError = '';
    this.cameraReady = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.cameraError = 'Browser ini tidak mendukung kamera. Coba buka lewat localhost atau HTTPS.';
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      await new Promise(resolve => window.setTimeout(resolve, 100));
      if (this.cameraVideo) {
        const video = this.cameraVideo.nativeElement;
        video.srcObject = this.stream;
        await video.play();
        this.cameraReady = true;
        void this.loadSmileModel();
      }
    } catch (error) {
      this.cameraError = 'Kamera belum bisa dibuka. Izinkan akses kamera di browser, lalu tekan Coba lagi. Kamera hanya diproses di perangkat ini.';
    }
  }

  private async loadSmileModel(): Promise<void> {
    if (this.faceModelLoading || this.landmarker) return;
    this.faceModelLoading = true;
    try {
      const vision = await FilesetResolver.forVisionTasks('./assets/wasm');
      this.landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: 'GPU' },
        runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true
      });
      this.trackSmile();
    } catch {
      this.cameraError = 'Model pendeteksi senyum gagal dimuat. Periksa koneksi internet lalu tekan Coba lagi.';
    } finally { this.faceModelLoading = false; }
  }

  private trackSmile(): void {
    const tick = () => {
      if (!this.modalOpen || this.step !== 'smile' || !this.landmarker || !this.cameraVideo) return;
      const video = this.cameraVideo.nativeElement;
      if (video.readyState >= 2 && video.currentTime !== this.lastVideoTime) {
        this.lastVideoTime = video.currentTime;
        const result = this.landmarker.detectForVideo(video, performance.now());
        const categories = result.faceBlendshapes?.[0]?.categories ?? [];
        const left = categories.find(item => item.categoryName === 'mouthSmileLeft')?.score ?? 0;
        const right = categories.find(item => item.categoryName === 'mouthSmileRight')?.score ?? 0;
        // Skor senyum adalah estimasi dari model wajah, bukan ukuran ilmiah atau penilaian emosi.
        this.smilePercent = Math.round(Math.min(100, ((left + right) / 2) * 100));
        if (this.smilePercent >= 80) this.smilePassed = true;
      }
      this.animationFrame = requestAnimationFrame(tick);
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  retryCamera(): void { this.stopCamera(); void this.startCamera(); }

  continueFromSmile(): void {
    if (!this.smilePassed) return;
    this.stopCamera();
    this.step = 'mood';
  }

  chooseMood(mood: 'baik' | 'sedih'): void {
    this.selectedMood = mood;
    this.step = mood === 'sedih' ? 'story' : 'date';
  }

  continueStory(): void { this.step = 'date'; }

  dateIsWeekend(): boolean {
    if (!this.selectedDate) return false;
    const day = new Date(`${this.selectedDate}T12:00:00`).getDay();
    return day === 0 || day === 6;
  }


  sendWhatsApp(isUncertain: boolean = false): void {

  if (!isUncertain && (!this.selectedDate || !this.dateIsWeekend())) {
    this.dateError = 'Pilih tanggal Sabtu atau Minggu dulu yaa.';
    return;
  }
  this.dateError = '';

  const moodText = this.selectedMood === 'sedih' ? 'Aku lagi sedih :(' : 'Aku baik hari ini :D';
  const storyText = this.selectedMood === 'sedih' && this.story.trim() ? `\nSedikit ceritaku: ${this.story.trim()}` : '';


  let dateSection = '';
  if (isUncertain || !this.selectedDate) {
    dateSection = 'Tanggal yang aku pilih: (Belum bisa nentuin / Nanti dikabari lagi yaa :D)';
  } else {
    const date = new Date(`${this.selectedDate}T12:00:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    dateSection = `Tanggal yang aku pilih: ${date}`;
  }

  const message = `Halooo Kak, ku sudah senyum hari ini :D \n\n${moodText}${storyText}\n\nsoal ke Vilo Cimanggis \n\n${dateSection}\nLokasi: ${this.mapUrl}\n\nisi keterangan tambahan... ✨`;
  
  const number = this.whatsappNumber.replace(/\D/g, '');
  const url = number && !number.includes('XXXXXXXX') && number.length >= 8
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
  window.open(url, '_blank', 'noopener,noreferrer');
  this.step = 'done';
}

  closeModal(): void { this.modalOpen = false; this.stopCamera(); }

  private stopCamera(): void {
    cancelAnimationFrame(this.animationFrame);
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = undefined;
    if (this.cameraVideo) this.cameraVideo.nativeElement.srcObject = null;
    this.cameraReady = false;
  }

  private toLocalDate(date: Date): string {
    const year = date.getFullYear(); const month = `${date.getMonth() + 1}`.padStart(2, '0'); const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  ngOnDestroy(): void { this.stopCamera(); this.landmarker?.close(); }
}
