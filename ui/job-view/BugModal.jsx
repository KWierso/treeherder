import React from 'react';
import ReactModal from 'react-modal';
import PropTypes from 'prop-types';

ReactModal.setAppElement('#global-container');

export default class BugModalComponent extends React.Component {
  constructor(props) {
    super(props);
    /* console.log(this.props.failureDetails); */
    this.state = {
      showModal: this.props.showModal,
      summaryLength: 0,
      failureDetails: this.props.failureDetails,
    };
    this.modalRef = React.createRef();
    this.summaryRef = React.createRef();
  }

  componentDidMount() {
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.summaryChange = this.summaryChange.bind(this);
    console.log('HI', this.state.failureDetails);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      showModal: nextProps.showModal,
      failureDetails: nextProps.failureDetails,
    }, () => console.log('HI2', this.state.failureDetails),
    );
  }

  componentWillUnmount() {
    /* console.log('unmounting'); */
  }

  handleCloseModal() {
    /* this.state = { showModal: false }; */
  }

  summaryChange(evt) {
    this.setState({ summaryLength: evt.target.value.length });
  }

  render() {
    return (
      <ReactModal
        ref={this.modalRef}
        isOpen={this.props.showModal}
        onRequestClose={this.handleCloseModal}
        shouldCloseOnOverlayClick
        style={{
          overlay: {
            zIndex: 1000,
          },
          content: {
            top: '10%',
            bottom: '10%',
            left: '10%',
            right: '10%',
          },
        }}
      >
        <div className="bug-modal-header">
          <h4>Intermittent Bug Filer</h4>
          <button type="button" className="close">
            <span aria-hidden="true">&times;</span><span className="sr-only">Close</span>
          </button>
        </div>
        <div className="bug-modal-body">
          <form id="bug-modal-form">
            <input id="bug-modal-product-finder" type="text" />
          </form>
          <button id="bug-modal-product-finder-button"> Find Product </button>
          <div>
            <div id="bug-modal-product-search-spinner">
              <span className="fa fa-spinner fa-pulse th-spinner-lg" />
              Searching...
            </div>
            <div> PRODUCT SEARCH RESULTS </div>
          </div>

          <br /><br />

          <div id="bug-modal-failure-summary-group">
            <div> UNHELPFUL SUMMARY REASON </div>
            <label id="modal-summary-label" htmlFor="modalSummary">Summary:</label>
            <input id="modal-summary" type="text" onChange={this.summaryChange} value={this.state.failureDetails.fullLog} />
            <span id="modal-summary-length">{ this.state.summaryLength }</span>
            <a className="summarybutton">
              <i>CHEVRON</i>
              <span>
                <i>CHEVRON</i>
                <textarea id="modal-failure-list" />
              </span>
            </a>
          </div>

          <div id="bug-modal-loglink-checkboxes">
            <label>
              <input id="modal-parsed-log" type="checkbox" />
              <a> Include Parsed Log Link</a>
            </label><br />
            <label>
              <input id="modal-full-log" type="checkbox" />
              <a> Include Full Log Link</a>
            </label><br />
            <label>
              <input id="modal-reftest-log" type="checkbox" />
              <a> Include Reftest Viewer Link</a>
            </label><br />
          </div>

          <div id="bug-modal-comment-div">
            <label id="modal-comment-label" htmlFor="modal-comment">Comment:</label>
            <textarea id="modal-comment" />
          </div>

          <div id="bug-modal-extras">
            <label>
              <input
                id="modal-is-intermittent"
                type="checkbox"
              />
              This is an intermittent failure
            </label>

            <div id="modal-related-bugs">
              <input type="text" placeholder="Blocks" />
              <input type="text" placeholder="Depends on" />
              <input type="text" placeholder="See also" />
            </div>

            { this.state.failureDetails.crashSignatures ? this.state.failureDetails.crashSignatures.length ?
              <div id="modal-crash-signature-div">
                <label id="modal-crash-signature=label" htmlFor="modalCrashSignature">Signature:</label>
                <textarea id="modal-crash-signature" maxLength="2048">{this.state.failureDetails.crashSignatures}</textarea>
              </div>
            : null : null }
          </div>
        </div>
        <div className="bug-modal-footer">
          <button name="modal-cancel-button" id="modal-cancel-button" type="button"> Cancel </button>
          <button name="modal-submit-button" id="modal-submit-button" type="button"> Submit Bug </button>
        </div>
      </ReactModal>
    );
  }
}

BugModalComponent.propTypes = {
  showModal: PropTypes.bool.isRequired,
  failureDetails: PropTypes.object.isRequired,
};

BugModalComponent.defaultProps = {
  failureDetails: {
    suggestions: [],
    jobLogUrls: [],
    logViewerFullUrl: '',
    selectedJob: {},
    reftestUrl: '',
  },
};
