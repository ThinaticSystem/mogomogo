// @ts-check
"use strict";

import { getLoginState } from "./service.js";
import { rootScene } from "./view.js";

const loginState = await getLoginState();
if (loginState.isLoggedIn) {
	rootScene.goto("loggedIn", {
		user: loginState.user,
	});
} else {
	rootScene.goto("loggedOut");
}
