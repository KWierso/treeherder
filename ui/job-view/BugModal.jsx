import React from 'react';
import ReactModal from 'react-modal';
import PropTypes from 'prop-types';

ReactModal.setAppElement('#global-container');

export default class BugModalComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showModal: false,
    };
  }

  fileBug() {
    this.setState({ showModal: true });
  }

  render() {
    return (
      <ReactModal
        isOpen={this.props.showModal}
        style={{
          overlay: {
            zIndex: 1000,
          },
        }}
      >
        <div className="bug-modal-header">
          <h4>Intermittent Bug Filer</h4>
        </div>
        <div className="bug-modal-body">
          <form id="bug-modal-form">
            <input id="bug-modal-product-finder" type="text" />
          </form>
          <button id="bug-modal-product-finder-button"> Find Product </button>
          <div>
            <div id="bug-modal-product-search-spinner">SPINNER</div>
            <div> PRODUCT SEARCH RESULTS </div>
          </div>

          <br /><br />

          <div id="bug-modal-failure-summary-group">
            <div> UNHELPFUL SUMMARY REASON </div>
            <label id="modal-summary-label" htmlFor="modalSummary">Summary:</label>
            <input id="modal-summary" type="text" />
            <span id="modal-summary-length">LENGTH</span>
            <div> FULL FAILURE TEXT </div>
          </div>

          <div id="bug-modal-loglink-checkboxes">LOG LINK CHECKBOXES</div>

          <div id="bug-modal-comment-div">COMMENTBOX</div>

          <div id="bug-modal-extras">EXTRAS</div>
        </div>
        <div className="bug-modal-footer">
          <span>Cancel</span>
          <span>Submit</span>
        </div>
      </ReactModal>
    );
  }
}

BugModalComponent.propTypes = {
  showModal: PropTypes.bool.isRequired,
};

BugModalComponent.defaultProps = {
};
