# If Memories Could Be Rewritten

This folder contains the first local prototype for Assessment 3.

## How to open it

No package installation is required. Open `index.html` in a browser, or serve this folder with a local static server when testing interaction.

## Current prototype

The current prototype includes the opening mouse and touch interaction, the four-object memory interface, five scenes, the rejected present-day responses, line-by-line reveals for the university and hospital scenes, and the final black screen. Scene timestamps and scene-number labels have been removed from the story view. The first three scenes now present only the situation, followed by a `Me:` label and the response choices. The hospital scene opens with direct context about Grandma's condition before the conversation begins. Screen changes use a slow fade-to-black transition, and selecting a historical response gradually desaturates the current scene before it fades out. A low-volume hospital ambience track is now attached to the hospital scene and fades in and out with the scene. The layout includes a basic mobile breakpoint and larger touch targets, but final device testing and deployment are still required.

Environmental audio is now included. Childhood uses low-volume kitchen and water layers, Middle school uses a phone ring, High school uses a short money-note movement cue, University uses air conditioning and phone vibration, and Hospital present uses the selected `Ambience Air Conditioner Level Three 01.wav` ambience. The browser-facing audio files use a smaller mono WAV conversion for faster deployment, while the original WAV files remain in the local working assets. Wilderness audio remains unused because it does not match the current story spaces. The next production step is to test the balance with headphones and revise timing, typography, accessibility, and feedback based on user testing.
