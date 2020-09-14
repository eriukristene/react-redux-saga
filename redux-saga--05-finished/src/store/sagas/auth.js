import { delay } from "redux-saga";
import { put, call } from "redux-saga/effects";
import axios from "axios";

import * as actions from "../actions/index";

// all actions here

// turns the function into a generator
// generators are next-gen functions which can be executed incrementally
// you can call them and they don't run from start to end immediately
// but you can pause during function execution
// for example, to wait for async code to finish
export function* logoutSaga(action) {
  // executes each of these one at a time
  // call - allows you to call some function on some object
  // this way makes the generators testable
  // there are other ways to write these, can see examples below
  yield call([localStorage, "removeItem"], "token");
  yield call([localStorage, "removeItem"], "expirationDate");
  yield call([localStorage, "removeItem"], "userId");

  // these do the same as the three lines above
  // yield localStorage.removeItem("token");
  // yield localStorage.removeItem("expirationDate");
  // yield localStorage.removeItem("userId");

  // put: dispatches a new action
  yield put(actions.logoutSucceed());
}

// handles the async code and side effects of the timer that were
// previously in actions/auth.js
// just rewrote what we had before with setTimeout() (in actions/auth.js) 
// to use redux saga delay()
export function* checkAuthTimeoutSaga(action) {
  yield delay(action.expirationTime * 1000);
  yield put(actions.logout());
}

export function* authUserSaga(action) {
  // put is similar to dispatch
  yield put(actions.authStart());
  const authData = {
    email: action.email,
    password: action.password,
    returnSecureToken: true
  };
  let url =
    "https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=AIzaSyB5cHT6x62tTe-g27vBDIqWcwQWBSj3uiY";
  if (!action.isSignup) {
    url =
      "https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyB5cHT6x62tTe-g27vBDIqWcwQWBSj3uiY";
  }
  try {
    // but here, it doesn't return a promise
    // rather, it waits for whatever is returned from axios.post
    // either resolve or reject
    // and stores it in response
    // Lesson 417
    const response = yield axios.post(url, authData); // axios.post returns a promise

    const expirationDate = yield new Date(
      new Date().getTime() + response.data.expiresIn * 1000
    );
    yield localStorage.setItem("token", response.data.idToken);
    yield localStorage.setItem("expirationDate", expirationDate);
    yield localStorage.setItem("userId", response.data.localId);
    yield put(
      actions.authSuccess(response.data.idToken, response.data.localId)
    );
    yield put(actions.checkAuthTimeout(response.data.expiresIn));
  } catch (error) {
    yield put(actions.authFail(error.response.data.error));
  }
}

export function* authCheckStateSaga(action) {
  // synchronous task here
  const token = yield localStorage.getItem("token");
  if (!token) {
    yield put(actions.logout());
  } else {
    const expirationDate = yield new Date(
      localStorage.getItem("expirationDate")
    );
    if (expirationDate <= new Date()) {
      yield put(actions.logout());
    } else {
      const userId = yield localStorage.getItem("userId");
      yield put(actions.authSuccess(token, userId));
      yield put(
        actions.checkAuthTimeout(
          (expirationDate.getTime() - new Date().getTime()) / 1000
        )
      );
    }
  }
}
