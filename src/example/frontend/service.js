// @ts-check
"use strict";

import { callBackendApi } from "./util/backend-api.js";
import { Result } from "./util/result.js";

export const getLoginState = async () => {
	const loginState = await callBackendApi("/login-state", "GET", {});
	return loginState;
};

const createPeerConnection = () =>
	new RTCPeerConnection({
		iceServers: [
			{
				urls: "stun:stun.cloudflare.com:3478",
			},
		],
		bundlePolicy: "max-bundle",
	});

/**
 * @param {object} opts
 * @param {HTMLVideoElement} opts.$video
 */
export const startMuttering = ({ $video }) =>
	Result.wrapAsyncProcess(async () => {
		const media = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		});
		$video.srcObject = media;

		// Start muttering
		const peerConnection = createPeerConnection();
		const transceivers = media.getTracks().map((track) =>
			peerConnection.addTransceiver(track, {
				direction: "sendonly",
			}),
		);
		const offer = await peerConnection.createOffer();
		await peerConnection.setLocalDescription(offer);

		const { sessionDescription } = await callBackendApi("/start-muttering", "POST", {
			body: {
				sessionDescription: {
					sdp: offer.sdp,
				},
				tracks: transceivers.map(({ mid, sender }) => ({
					trackName: sender.track?.id,
					mid,
				})),
			},
		});

		// Setting up the ICE connection state handler needs to happen before
		// setting the remote description to avoid race conditions.
		const connected = new Promise((res, rej) => {
			// timeout after 5s
			setTimeout(rej, 5000);
			const iceConnectionStateChangeHandler = () => {
				if (peerConnection.iceConnectionState === "connected") {
					peerConnection.removeEventListener(
						"iceconnectionstatechange",
						iceConnectionStateChangeHandler,
					);
					res(undefined);
				}
			};
			peerConnection.addEventListener("iceconnectionstatechange", iceConnectionStateChangeHandler);
		});
		// We take the answer we got from the Calls API and set it as the
		// peer connection's remote description, which is an answer in this case.
		await peerConnection.setRemoteDescription(new RTCSessionDescription(sessionDescription));

		// Wait until the peer connection's iceConnectionState is "connected"
		await connected;

		return {
			sessionDescription,
		};
	});

/**
 * @param {object} opts
 * @param {{
 *   sdp: string;
 * }} opts.sessionDescription
 */
export const stopMuttering = async ({ sessionDescription }) =>
	Result.wrapAsyncProcess(async () => {
		await callBackendApi("/stop-muttering", "POST", {
			body: {
				sessionDescription: {
					sdp: sessionDescription.sdp,
				},
			},
		});
	});

/**
 * @param {object} opts
 * @param {string} opts.muttererSessionId
 * @param {HTMLVideoElement} opts.$video
 */
export const startTapping = async ({ muttererSessionId, $video }) =>
	Result.wrapAsyncProcess(async () => {
		const startTappingResult = await callBackendApi("/start-tapping", "POST", {
			body: {
				muttererSessionId,
			},
		});

		const remotePeerConnection = createPeerConnection();

		const resolvingTracks = Promise.all(
			startTappingResult.tracks.map(
				({ mid }) =>
					// This will resolve when the track for the corresponding mid is added.
					/** @type {Promise<MediaStreamTrack>} */ (
						new Promise((res, rej) => {
							setTimeout(rej, 5000);
							/**
							 * @param {RTCTrackEvent} event
							 */
							const handleTrack = ({ transceiver, track }) => {
								if (transceiver.mid !== mid) return;
								remotePeerConnection.removeEventListener("track", handleTrack);
								res(track);
							};
							remotePeerConnection.addEventListener("track", handleTrack);
						})
					),
			),
		);

		// Handle renegotiation, this will always be true when pulling tracks
		if (startTappingResult.requiresImmediateRenegotiation) {
			// We got a session description from the remote in the response,
			// we need to set it as the remote description
			await remotePeerConnection.setRemoteDescription(startTappingResult.sessionDescription);
			// Create an answer
			const remoteAnswer = await remotePeerConnection.createAnswer();
			// And set it as local description
			await remotePeerConnection.setLocalDescription(remoteAnswer);
			// Send our answer back to the Calls API
			await callBackendApi("/renegotiate-tapping", "POST", {
				body: {
					sessionDescription: {
						sdp: remoteAnswer.sdp,
					},
				},
			});
		}

		// Now we wait for the tracks to resolve
		const pulledTracks = await resolvingTracks;

		// Lastly, we set them in the remoteVideo to display
		const remoteVideoStream = new MediaStream();
		$video.srcObject = remoteVideoStream;
		for (const track of pulledTracks) {
			remoteVideoStream.addTrack(track);
		}

		return {
			sessionDescription: remotePeerConnection.localDescription,
		};
	});

/**
 * @param {object} opts
 * @param {{
 *   sdp: string;
 * }} opts.sessionDescription
 * @param {string} opts.muttererSessionId
 */
export const stopTapping = async ({ sessionDescription, muttererSessionId }) =>
	Result.wrapAsyncProcess(async () => {
		await callBackendApi("/stop-tapping", "POST", {
			body: {
				sessionDescription: {
					sdp: sessionDescription.sdp,
				},
				muttererSessionId,
			},
		});
	});
