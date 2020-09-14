import { put } from "redux-saga/effects";

import axios from "../../axios-orders";
import * as actions from "../actions";

// took this async code from the burgerBuilder.js in actions folder
export function* initIngredientsSaga(action) {
  try {
    const response = yield axios.get(
      "https://react-my-burger-7d58a.firebaseio.com/ingredients.json"
    );
    yield put(actions.setIngredients(response.data));
  } catch (error) {
    yield put(actions.fetchIngredientsFailed());
  }
}
