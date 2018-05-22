import React, { Component } from 'react';
import { Container, Row, Col, Hidden } from 'react-grid-system';
import dateFormat from 'dateformat';
import { Doughnut } from 'react-chartjs-2';

import pollData from './poll.json';
import './css/style.css';

const PollingWrapper = ({content, onVote}) => {
  const choices = [];
  const labels = [];
  const labelsData = [];
  for (let i = 0; i < content.answer.options.length; i++) {
    choices.push(
      <a data-value={content.answer.options[i].id} key={`choice${i}`} onClick={() => onVote(content.answer.options[i].id)}>
        {content.answer.options[i].label}
      </a>);
    labels.push(content.answer.options[i].label);
    labelsData.push(content.choice[content.answer.options[i].id]);
  }

  const chatData = {
    labels: labels,
    datasets: [{
      data: labelsData,
      backgroundColor: [
        "red",
        "green",
        "purple",
        "blue",
        "orange",
        "black",
      ],
    }],
  };

  const pieChart = <Doughnut data={chatData} />;

  return (
    <div>
      <h2>Today's Poll</h2>
      <p className="date">{content.date}</p>
      <p className="title">{content.title}</p>
      <div className="choice-wrapper">
        {choices}
      </div>
      <p className="total-votes">Total number of votes recorded: {content.total}</p>
      <div className="chart">{pieChart}</div>
    </div>
  );
}

const PollingItem = ({content}) => {
  return (
    <div>
      <Hidden xs sm>
        <Col md={3} className="chart-wrapper">
          <div className="chart"></div>
        </Col>
      </Hidden>
      <Col md={9} className="content-wrapper">
        <p className="date">{content.date}</p>
        <p className="title">{content.title}</p>
      </Col>
    </div>
  );
}

class App extends Component {
  constructor(props) {
    super(props);

    this.pollResult = {};
    this.state = {
      currentQuestion: 0,
      total: 0,
      choice: {},
    };

    fetch('http://localhost:9000/count', {}).then(res => res.json())
      .then((result) => {
        let total = 0;
        const choice = {};
        for (let i = 0; i < result.length; i++) {
          if (result[i]._id.question === (this.state.currentQuestion + 1)) {
            total += result[i].total;
            choice[result[i]._id.choice] = result[i].total;
          }
        }

        this.pollResult = result;
        this.setState({
          total,
          choice,
        });
      });
  }

  _onVote = (choice) => {
    fetch('http://localhost:9000/poll', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: this.state.currentQuestion + 1,
        choice: choice,
      })
    });

    if (this.state.currentQuestion < pollData.polls.length - 1) {
      let total = 0;
      const choice = {};
      for (let i = 0; i < this.pollResult.length; i++) {
        if (this.pollResult[i]._id.question === (this.state.currentQuestion + 2)) {
          total += this.pollResult[i].total;
          choice[this.pollResult[i]._id.choice] = this.pollResult[i].total;
        }
      }

      this.setState({
        total,
        choice,
        currentQuestion: this.state.currentQuestion + 1,
      });
    } else {
      alert('Thank you for your poll');
      window.location.reload();
    }
  };

  render = () => {
    const pollingItems = [];
    for (let i = 0; i < pollData.polls.length; i++) {
      if (i !== this.state.currentQuestion) {
        const date = new Date(pollData.polls[i].publishedDate * 1000);
        const dateWithFormat = dateFormat(date, "dd mmm yyyy");

        const content = {
          date: dateWithFormat,
          title: pollData.polls[i].title,
        };

        pollingItems.push(
          <Col sm={6} className="pollingItem" key={i}>
            <PollingItem content={content}/>
          </Col>
        );
      }
    }

    const date = new Date(pollData.polls[this.state.currentQuestion].publishedDate * 1000);
    const dateWithFormat = dateFormat(date, "dddd, dS mmmm, yyyy, h:MMTT");
    const pollingWrapperContent = {
      date: dateWithFormat,
      title: pollData.polls[this.state.currentQuestion].title,
      answer: pollData.polls[this.state.currentQuestion].answer,
      total: this.state.total,
      choice: this.state.choice,
    };

    return (
      <Container>
        <Row>
          <Col sm={12} className="pollingWrapper">
            <PollingWrapper content={pollingWrapperContent} onVote={this._onVote}/>
          </Col>
          {pollingItems}
        </Row>
      </Container>
    );
  };
}

export default App;
