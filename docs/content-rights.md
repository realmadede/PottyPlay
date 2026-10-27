# PottyPlay Content Rights & Licensing Boundaries

## 1. Studio Rights Protection Model

Major motion picture studios maintain strict licensing covenants regarding the theatrical exhibition window:
- Digital Cinema Packages (DCPs) projected in commercial auditoriums are cryptographically locked with Key Delivery Messages (KDMs).
- Commercial cinema exhibitors are strictly prohibited from re-transmitting encrypted theatrical streams across public networks without explicit rights-holder licensing.

PottyPlay is engineered with a **multi-layered rights boundary** that respects studio covenants:
1. **RightsAuthorization Table:** Playback cannot be initiated unless an explicit, unexpired record exists in the database linking the `ContentAsset`, the `Cinema` venue, and the screening time window.
2. **Session Limit Cap:** Studio exhibition guidelines mandate that companion viewing cannot exceed 15 minutes (900 seconds) per patron screening.
3. **Fail-Closed Verification:** If rights authorization is revoked, expired, or missing, `TicketService.verifyTicket` and `SessionService.activateSession` immediately reject access with code `RIGHTS_UNAUTHORIZED`.
4. **Tenant Isolation:** Rights authorizations are scoped to specific cinema venue IDs. A rights grant for Century Cinemax cannot be accessed by Oasis Cinema.

## 2. Demonstration Assets & Licensing

In this demonstration environment:
- **Zero DCP Tampering:** PottyPlay does not access, rip, decode, or redistribute encrypted cinema DCPs or commercial copyrighted movie files.
- **Original Demonstration Asset:** Playback uses an authorized visual demonstration asset (*Serengeti Shadows: The Silent Guardian*), rendered dynamically via an interactive HTML5 Canvas engine with SMPTE timecode watermarking.
- **Creative Commons Compliance:** Demonstration media is registered under Creative Commons BY-NC 4.0 and open cultural archives for theatrical platform testing.
- **Clear Disclaimers:** All interfaces prominently identify simulated cinema partner integrations and financial models.

## 3. Commercial Roadmap for Theatrical DRM

For commercial cinema pilot deployments:
- **Widevine Modular & FairPlay DRM:** HLS / DASH video manifests will be encrypted with CBCS / CTR content encryption keys issued by an approved studio DRM provider (e.g., EZDRM, BuyDRM, or AWS MediaPackage).
- **Dynamic Watermarking:** Patron seat numbers, venue IDs, and session timestamps will be visibly and forensically watermarked across client playback frames to deter camcording or recording.
- **Hardware-Enforced Security:** On mobile devices, playback will require Widevine L1 or Apple Secure Enclave hardware decryption, preventing screen recording or HDMI capture.
