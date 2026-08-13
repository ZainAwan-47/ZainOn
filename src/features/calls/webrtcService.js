// Google's free public STUN servers (Perfect for Firebase Spark Plan / No-cost peer-to-peer)
const RTC_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
    ]
};

export class WebRTCService {
    constructor() {
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = new MediaStream();

        // Callbacks to be assigned by the CallProvider/React layer
        this.onIceCandidate = null;
        this.onRemoteTrack = null;
        this.onConnectionStateChange = null;
    }

    /**
     * 1. Acquire Local Media (Mic/Camera)
     */
    async getLocalMedia(type) {
        try {
            const constraints = {
                audio: true,
                video: type === 'video' ? { facingMode: 'user' } : false
            };
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.localStream;
        } catch (error) {
            console.error('[WebRTCService] Error getting user media:', error);
            throw error; // Let the UI handle the permission denial
        }
    }

    /**
     * 2. Initialize the RTCPeerConnection
     */
    initPeerConnection() {
        this.peerConnection = new RTCPeerConnection(RTC_CONFIG);

        // Add local tracks to the connection
        if (this.localStream) {
            this.localStream.getTracks().forEach((track) => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }

        // Listen for remote tracks
        this.peerConnection.ontrack = (event) => {
            event.streams[0].getTracks().forEach((track) => {
                this.remoteStream.addTrack(track);
            });
            if (this.onRemoteTrack) {
                this.onRemoteTrack(this.remoteStream);
            }
        };

        // Listen for local ICE candidates to send to Firestore
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onIceCandidate) {
                this.onIceCandidate(event.candidate);
            }
        };

        // Monitor connection state (connecting, connected, disconnected, failed)
        this.peerConnection.onconnectionstatechange = () => {
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(this.peerConnection.connectionState);
            }
        };
    }

    /**
     * 3. Create an Offer (For the Caller)
     */
    async createOffer() {
        if (!this.peerConnection) this.initPeerConnection();

        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        return {
            type: offer.type,
            sdp: offer.sdp
        };
    }

    /**
     * 4. Handle an incoming Offer & Create an Answer (For the Receiver)
     */
    async handleOfferAndCreateAnswer(offerSdp) {
        if (!this.peerConnection) this.initPeerConnection();

        const remoteDesc = new RTCSessionDescription({ type: 'offer', sdp: offerSdp });
        await this.peerConnection.setRemoteDescription(remoteDesc);

        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);

        return {
            type: answer.type,
            sdp: answer.sdp
        };
    }

    /**
     * 5. Handle the incoming Answer (For the Caller)
     */
    async handleAnswer(answerSdp) {
        if (!this.peerConnection) return;
        const remoteDesc = new RTCSessionDescription({ type: 'answer', sdp: answerSdp });
        await this.peerConnection.setRemoteDescription(remoteDesc);
    }

    /**
     * 6. Add incoming ICE Candidate (Trickle ICE)
     */
    async addIceCandidate(candidateData) {
        if (!this.peerConnection) return;
        try {
            const candidate = new RTCIceCandidate(candidateData);
            await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('[WebRTCService] Error adding ICE candidate:', error);
        }
    }

    /**
     * 7. Track Toggles (Mute/Video)
     */
    toggleAudio(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(t => t.enabled = enabled);
        }
    }

    toggleVideo(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(t => t.enabled = enabled);
        }
    }

    /**
     * 8. Cleanup & Teardown
     */
    cleanup() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop(); // Strictly turn off camera/mic hardware light
            });
            this.localStream = null;
        }

        if (this.peerConnection) {
            this.peerConnection.ontrack = null;
            this.peerConnection.onicecandidate = null;
            this.peerConnection.onconnectionstatechange = null;
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.remoteStream = new MediaStream(); // Reset
    }
}