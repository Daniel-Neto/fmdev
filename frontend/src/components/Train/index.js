import * as moment from 'moment';
import React, { Component } from 'react';
import { ConfigContainer } from '../../styles/ConfigContainer';
import BreadCrumb from '../BreadCrumb';
import {
  Header, Table,
  FirstHeaderColumn, HeaderColumn,
  FirstItemColumn, ItemColumn, TrainInfo,
  StatusMsgContainer, ScoreContainer
} from './styles';
import Button from '../../styles/Button';
import { PRE_PROCESSING, ADD_TRAIN, TRAIN_MODEL } from '../../constants';
import { connect } from 'react-redux';
import Countdown from 'react-countdown';
import PerfectScrollbar from 'react-perfect-scrollbar';
import CheckIcon from 'react-feather/dist/icons/check';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Creators as TrainStatusActions } from '../../store/ducks/train_status';
import { Creators as TrainActions } from '../../store/ducks/train';
import { actions as toastrActions } from 'react-redux-toastr';
import { Creators as ScreenActions } from '../../store/ducks/screen';
import { Beforeunload } from 'react-beforeunload';
import AlertDialog from '../AlertDialog';
import TrainModelSaveDialog from '../TrainModelSaveDialog';
import { Creators as DialogActions } from '../../store/ducks/dialog';

class Train extends Component {

  state = {
    interval: null,
    countdown: Date.now()
  };

  componentDidMount() {
    const interval = window.setInterval(this.callTrainStatus, 1000 * 20);

    this.setState({
      countdown: Date.now(),
      interval
    });

    this.props.trainStatusInit();
  }

  callTrainStatus = () => {
    const { path } = this.props.pre_processing;
    this.props.postTrainStatus({ path });
  }

  componentWillUnmount() {
    clearInterval(this.state.interval);
  }

  getDiffExecutionTime = (item, idx) => {
    let diff = null;
    const { data } = this.props.train_status;
    let now = idx === 0 ? moment(this.state.countdown) : moment(data[idx - 1].date);
    let finishedAt = moment(item.date);
    let nowDiff = moment(
      [~~now.format('YYYY'), ~~now.format('MM'), ~~now.format('DD'),
      ~~now.format('HH'), ~~now.format('mm'), ~~now.format('ss')
      ])
    let finishDiff = moment(
      [~~finishedAt.format('YYYY'), ~~finishedAt.format('MM'), ~~finishedAt.format('DD'),
      ~~finishedAt.format('HH'), ~~finishedAt.format('mm'), ~~finishedAt.format('ss')])

    diff = finishDiff.diff(nowDiff, 'minutes');
    diff = Math.abs(diff);

    if (diff === 0) {
      diff = finishDiff.diff(nowDiff, 'seconds');
      diff = Math.abs(diff);

      return `${diff} segundos`;
    }

    if (diff === 1) {
      diff = `${diff} minuto`;
    }

    if (diff < 60) {
      diff = `${diff} minutos`;
    }

    if (diff >= 60 && diff <= 120) {
      diff = `${Math.round(diff / 60)} hora`;
    }

    if (diff >= 120) {
      diff = `${Math.round(diff / 60)} horas`;
    }

    return diff;
  }

  renderItem = (item, idx) => (
    <tr key={idx}>
      <FirstItemColumn>{this.getStatusIcon(item)}</FirstItemColumn>
      <ItemColumn>{item.step}</ItemColumn>
      <ItemColumn>{item.status}</ItemColumn>
      <ItemColumn>{item.date ? moment(item.date).format('DD/MM/YYYY HH:mm:ss') : null}</ItemColumn>
      <ItemColumn>{item.date ? this.getDiffExecutionTime(item, idx) : null}</ItemColumn>
      <ItemColumn>{item.score}</ItemColumn>
    </tr>
  )

  getStatusIcon = (item) => {
    if (item.status === 'Em andamento') {
      return (
        <ProgressSpinner
          style={{ width: '24px', height: '24px' }}
          strokeWidth="4"
          animationDuration=".5s" />
      )
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <CheckIcon color={'#12BB6A'} />
      </div>
    );
  }

  renderWarningMsg = (msg) => {
    this.props.add({
      type: 'warning',
      title: 'Atenção',
      message: msg
    });
  }

  getSplit = (value) => {
    const { data } = this.props.pre_processing;

    return ~~((data[0].count * this.props.screen.data[value]) / 100);
  }

  checkGoBackToPreProcessing = () => {
    const { data, loading } = this.props.train;

    if (loading) {
      this.renderWarningMsg('Não é possível voltar para a tela de pré-processamento durante o treinamento!');
      return;
    }

    if (Object.keys(data).length) {
      this.props.setDialog('alert', {
        description: 'Os dados gerados pelo treinamento serão perdidos. Você realmente deseja voltar para a tela de pré-processamento?'
      });
      return;
    }

    this.props.setScreen(ADD_TRAIN, PRE_PROCESSING);
  }

  deleteTrain = () => {
    const { path } = this.props.pre_processing;

    this.props.deleteTrain({ path });
    this.props.setScreen(ADD_TRAIN, PRE_PROCESSING);
  }

  openSaveModel = () => {
    this.props.setDialog('trainSave');
  }

  goToSaveModels = () => {
    this.props.setScreen(TRAIN_MODEL, TRAIN_MODEL, null);
  }

  render() {
    const { countdown } = this.state;
    const { train, screen, train_status, train_model } = this.props;
    const { loading, error } = this.props.train;
    const { data } = this.props.pre_processing;
    const isFinished = !train.loading && Object.keys(train.data).length > 0;

    return (
      <Beforeunload onBeforeunload={() => "Deseja Continuar?"}>
        <PerfectScrollbar style={{ width: '100%', overflowX: 'auto' }}>
          <ConfigContainer size='big' style={{ color: '#000' }}>

            <div onClick={this.checkGoBackToPreProcessing}>
              <BreadCrumb
                text='Voltar para pré-processamento'
              />
            </div>

            <Header>
              <h1>Treinamento</h1>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {train.data && train.data.score ? <ScoreContainer>Score de Teste: <b>{train.data.score.toFixed(2)}</b></ScoreContainer> : null}
                <Button disabled={!isFinished} filled={false}>Ver Métricas</Button>
                {train_model.lastModelSaved ?
                  <Button
                    filled={false}
                    onClick={this.goToSaveModels.bind(this)}>VER MODELOS SALVOS</Button> : null}
                {!train_model.lastModelSaved ?
                  <Button
                    onClick={isFinished ? this.openSaveModel.bind(this) : null}
                    disabled={!isFinished}>SALVAR MODELO</Button>
                  : null}
                {train_model.lastModelSaved ? <Button disabled={true}>MODELO SALVO</Button> : null}
              </div>
            </Header>

            <TrainInfo>
              <div><b>Total de instâncias:</b> {data && data.length > 0 ? data[0].count : 'N/A'}</div>
              {screen.data.time && loading ? <div><b>Tempo máximo de execução (previsto):</b> {screen.data.time} minutos</div> : null}
              {!loading ? <div>&nbsp;</div> : null}
            </TrainInfo>

            <TrainInfo>
              <div><b>Treinamento:</b> {screen.data.train}% ({this.getSplit('train')} instâncias)  | <b>Testes:</b> {screen.data.test}% ({this.getSplit('test')} instâncias)</div>
              {screen.data.time && loading ?
                <div>
                  <b>Tempo restante (previsto):</b> {loading ? <Countdown date={countdown + 1000 * 60 * screen.data.time} /> : 'N/A'}
                </div>
                : null}
              {!loading ? <div>&nbsp;</div> : null}
            </TrainInfo>


            {!loading && !error && !train_status.data.length ?
              <StatusMsgContainer> Sem dados de treinamento para serem exibidos. </StatusMsgContainer>
              : null}

            <Table>
              <thead>
                <tr>
                  <FirstHeaderColumn>&nbsp;</FirstHeaderColumn>
                  <HeaderColumn>Etapa</HeaderColumn>
                  <HeaderColumn>Status</HeaderColumn>
                  <HeaderColumn>Finalizado em</HeaderColumn>
                  <HeaderColumn>Tempo de Execução</HeaderColumn>
                  <HeaderColumn>Score (Treinamento)</HeaderColumn>
                </tr>
              </thead>

              <tbody>
                {train_status.data.map((item, idx) => this.renderItem(item, idx))}
                {loading ? this.renderItem({
                  step: `Treinamento ${train_status.data.length + 1}`,
                  status: 'Em andamento',
                  date: null,
                  score: null
                })
                  : null}
              </tbody>
            </Table>

          </ConfigContainer >
          <AlertDialog onSubmit={this.deleteTrain}></AlertDialog>
          <TrainModelSaveDialog />
        </PerfectScrollbar>
      </Beforeunload>
    )
  }
}

const mapStateToProps = ({ train, screen, pre_processing, train_status, train_model }) =>
  ({ train, screen, pre_processing, train_status, train_model });

export default connect(mapStateToProps,
  {
    ...TrainStatusActions, ...toastrActions,
    ...ScreenActions, ...DialogActions,
    ...TrainActions
  }
)(Train);