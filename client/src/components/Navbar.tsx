import React from "react";
import { Requester } from "../api.js";

interface NavbarProps {
  activeRequester: Requester | null;
  onChangeRequester: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRequester,
  onChangeRequester,
}) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-zen-green shadow-sm px-3 py-2">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="#home">
          <span className="fs-4">🎫</span>
          <span>TokTickIT</span>
        </a>

        {activeRequester && (
          <div className="d-flex align-items-center gap-3" data-testid="active-requester-info">
            <span className="text-white fw-medium" data-testid="active-requester-name">
              👤 {activeRequester.name}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-light fw-medium"
              onClick={onChangeRequester}
              data-testid="change-requester-btn"
            >
              Change Requester
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
