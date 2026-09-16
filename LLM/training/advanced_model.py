"""
ResQGrid AI - Advanced Multi-Commodity Disaster Demand Model (Phase 2 & 3)
Gradient Boosting Multi-Output Regressor with Log1p Target Transformation
and Empirical Quantile Uncertainty Bounds.
"""

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.preprocessing import RobustScaler
from typing import Dict, Any, List


class AdvancedDemandForecaster:
    """Multi-commodity disaster demand forecaster with log1p transformation and empirical quantile uncertainty bounds."""

    def __init__(self, n_estimators: int = 120, learning_rate: float = 0.08, max_depth: int = 5, random_state: int = 42):
        self.random_state = random_state
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth

        self.scaler = RobustScaler()
        self.regressor = MultiOutputRegressor(
            GradientBoostingRegressor(
                n_estimators=n_estimators,
                learning_rate=learning_rate,
                max_depth=max_depth,
                subsample=0.85,
                min_samples_split=5,
                random_state=random_state
            )
        )
        self.target_names: List[str] = []
        self.residual_quantiles: Dict[str, Dict[str, float]] = {}

    def fit(self, X: np.ndarray, y: np.ndarray, target_names: list):
        self.target_names = target_names
        X_scaled = self.scaler.fit_transform(X)
        y_log = np.log1p(np.maximum(y, 0))
        self.regressor.fit(X_scaled, y_log)

        # Compute empirical residual distributions on training data in log space
        preds_log = self.regressor.predict(X_scaled)
        residuals_log = y_log - preds_log

        for i, target in enumerate(target_names):
            target_res = residuals_log[:, i]
            self.residual_quantiles[target] = {
                "p10_log": float(np.percentile(target_res, 10)),
                "p50_log": float(np.percentile(target_res, 50)),
                "p90_log": float(np.percentile(target_res, 90)),
                "std_log": float(np.std(target_res))
            }
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        X_scaled = self.scaler.transform(X)
        preds_log = self.regressor.predict(X_scaled)
        preds_orig = np.expm1(preds_log)
        return np.maximum(preds_orig, 0)

    def predict_with_uncertainty(self, X: np.ndarray) -> List[Dict[str, Any]]:
        """Returns point predictions, p10 lower bounds, p90 upper bounds, and confidence scores."""
        X_scaled = self.scaler.transform(X)
        preds_log = self.regressor.predict(X_scaled)
        results = []

        for row_idx in range(len(X)):
            row_dict = {}
            for col_idx, target in enumerate(self.target_names):
                pred_log = float(preds_log[row_idx, col_idx])
                point_pred = max(0.0, float(np.expm1(pred_log)))

                p10_offset = self.residual_quantiles.get(target, {}).get("p10_log", -0.2)
                p90_offset = self.residual_quantiles.get(target, {}).get("p90_log", 0.2)

                lower_bound = max(0.0, float(np.expm1(pred_log + p10_offset)))
                upper_bound = max(lower_bound, float(np.expm1(pred_log + p90_offset)))

                rel_spread = (upper_bound - lower_bound) / max(point_pred, 1.0)
                confidence = max(0.55, min(0.98, round(1.0 - min(rel_spread * 0.15, 0.45), 2)))

                row_dict[target] = {
                    "predicted": round(point_pred, 1),
                    "lower_p10": round(lower_bound, 1),
                    "upper_p90": round(upper_bound, 1),
                    "confidence": confidence
                }
            results.append(row_dict)

        return results

    def get_feature_importances(self, feature_names: list) -> Dict[str, Dict[str, float]]:
        importances = {}
        for idx, target in enumerate(self.target_names):
            estimator = self.regressor.estimators_[idx]
            importances[target] = {
                feat: round(float(imp), 4)
                for feat, imp in zip(feature_names, estimator.feature_importances_)
            }
        return importances
