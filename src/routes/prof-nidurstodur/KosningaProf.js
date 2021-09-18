import SliderStyles from '../../../node_modules/rc-slider/assets/index.css';
import React, { PureComponent } from 'react';
import cx from 'classnames';
import PropTypes from 'prop-types';
import Slider from 'rc-slider';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { encodeAnswersToken } from '../../utils';
import s from './styles.scss';
import history from '../../history';
import Link from '../../Link';

const storageKey = 'prof:answers';

const initialAnswers = questions =>
  questions.reduce((all, { id }) => {
    // eslint-disable-next-line
    all[id] = null;
    return all;
  }, {});

const marks = {
  1: 'Mjög ósammála',
  3: 'Hlutlaus',
  5: 'Mjög sammála'
};

class Kosningaprof extends PureComponent {
  static contextTypes = {
    fetch: PropTypes.func.isRequired
  };
  static propTypes = {
    answers: PropTypes.shape({
      default: PropTypes.string.isRequired,
      textMap: PropTypes.object.isRequired
    }).isRequired,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        question: PropTypes.string.isRequired
      })
    ).isRequired
  };
  constructor(props) {
    super(props);

    this.state = {
      started: false,
      token: null,
      finished: false,
      visible: {},
      showReset: false,
      answers: initialAnswers(props.questions)
    };

    this.positions = {};

    this.onReset = this.onReset.bind(this);
    this.onSend = this.onSend.bind(this);
  }
  componentDidMount() {
    this.loadAnswers();
  }
  onReset() {
    // eslint-disable-next-line
    if (window.confirm('Ertu viss um að þú byrja upp á nýtt?')) {
      const answers = initialAnswers(this.props.questions);
      localStorage.removeItem(storageKey);
      this.setState({
        answers,
        showReset: false
      });
    }
  }
  onChange = id => value => {
    this.setState(({ answers }) => {
      const newAnswers = {
        ...answers,
        [id]: value
      };

      localStorage.setItem(storageKey, JSON.stringify(newAnswers));
      return {
        started: true,
        answers: newAnswers
      };
    });
  };
  async onSend() {
    const { answers } = this.state;
    const answerValues = Object.keys(answers)
      .map(x => answers[x])
      .map(x => (x == null ? this.props.answers.default : x));
    const answersToken = encodeAnswersToken(answerValues);

    this.context
      .fetch(`/konnun/replies/all?timestamp=${Date.now()}`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reply: answersToken
        })
      })
      .catch(console.error);

    history.push(`/kosningaprof/${answersToken}`);
  }
  loadAnswers() {
    const answers = JSON.parse(localStorage.getItem(storageKey));

    if (answers != null) {
      this.setState({ answers, showReset: true });
    }
  }
  render() {
    const { questions } = this.props;
    const { answers, showReset } = this.state;
    const hasData = Object.values(answers).some(value => value !== null);

    return (
      <div className={cx(s.root, s.questions)}>
        <div className={s.lead}>
          <p>
            Taktu kosningarpróf <strong>Kjóstu rétt</strong> til þess að sjá
            hvaða flokkur passar best við þínar skoðanir. Því fleiri spurningum
            sem þú svarar, því nákvæmari niðurstöður færðu.
          </p>
          {showReset && (
            <p>
              Þú getur tekið upp þráðinn frá því síðast og klárað prófið, eða{' '}
              <button className={s.reset} onClick={this.onReset}>
                byrjað
              </button>{' '}
              upp á nýtt.
            </p>
          )}
        </div>

        <div
          ref={element => {
            this.questionsEl = element;
          }}
        >
          {questions.map(({ question, id }) => (
            <div key={id} id={id} className={cx(s.question)}>
              <h3>{question}</h3>
              <Slider
                dots
                min={1}
                max={5}
                value={answers[id]}
                marks={marks}
                onChange={this.onChange(id)}
                dotStyle={{
                  borderColor: '#e9e9e9',
                  marginBottom: -5,
                  width: 18,
                  height: 18
                }}
                handleStyle={{
                  backgroundColor: '#333',
                  borderColor: '#999',
                  marginLeft: 4,
                  marginTop: -7,
                  width: 18,
                  height: 18
                }}
                trackStyle={{
                  backgroundColor: 'transparent'
                }}
              />
              {answers[id] !== null && (
                <button
                  className={s.skip}
                  onClick={() => {
                    this.onChange(id)(null);
                  }}
                >
                  <i>Sleppa spurningu</i>
                </button>
              )}
            </div>
          ))}
        </div>
        {hasData && (
          <p style={{ textAlign: 'center' }}>
            <button onClick={this.onSend}>Reikna niðurstöður</button>
          </p>
        )}
      </div>
    );
  }
}

export default withStyles(s, SliderStyles)(Kosningaprof);
