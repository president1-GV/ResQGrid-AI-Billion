"""
ResQGrid AI - Baseline Demand Forecasting Model (Phase 1)
Ridge Multi-Output Linear Regression baseline with Log1p Target Transformation.
"""

from sklearn.linear_model import Ridge
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import StandardScaler
import numpy as np


class ScaledLogRidge:
    """Top-level serializable baseline regressor."""
    def __init__(self, alpha: float = 1.0, random_state: int = 42):
        self.alpha = alpha
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.reg = MultiOutputRegressor(Ridge(alpha=alpha, random_state=random_state))

    def fit(self, X, y):
        X_scaled = self.scaler.fit_transform(X)
        y_log = np.log1p(np.maximum(y, 0))
        self.reg.fit(X_scaled, y_log)
        return self

    def predict(self, X):
        X_scaled = self.scaler.transform(X)
        preds_log = self.reg.predict(X_scaled)
        return np.maximum(np.expm1(preds_log), 0)


def build_baseline_model(alpha: float = 1.0, random_state: int = 42):
    return ScaledLogRidge(alpha=alpha, random_state=random_state)
