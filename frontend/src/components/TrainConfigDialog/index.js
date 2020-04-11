import React, { Component } from 'react';
import {
  DialogForm, DialogFormButtonContainer, DialogSpan
} from './styles';
import { Creators as DialogActions } from '../../store/ducks/dialog';
import { connect } from 'react-redux';
import Dialog from '../Dialog';
import Button from '../../styles/Button';
import { actions as toastrActions } from 'react-redux-toastr';
import CurrencyInput from 'react-currency-input';

class TrainConfigDialog extends Component {

  state = {
    train: 70,
    test: 30,
    time: 10
  };

  onClose = () => {
    this.props.setDialog('trainConfig');
  }

  renderWarningMsg = (msg) => {
    this.props.add({
      type: 'warning',
      title: 'Atenção',
      message: msg
    });
  }

  submit = () => {
    const { train, test, time } = this.state;
    const { onSubmit } = this.props;

    if (!train || train <= 0) {
      this.renderWarningMsg('O percentual da base de treinamento é inválido!');
      return;
    }

    if (!test || test <= 0) {
      this.renderWarningMsg('O percentual da base de testes é inválido!');
      return;
    }

    if (!time || time <= 0) {
      this.renderWarningMsg('O tempo máximo de execução é inválido!');
      return;
    }

    if (time > 1440) {
      this.renderWarningMsg('O tempo máximo de execução não pode ser superior à 1 dia (1440 minutos)');
      return;
    }

    this.onClose();

    if (onSubmit) {
      onSubmit({ data: { train, test, time } });
    }
  }

  handlePercentualChange = (event, maskedValue, floatValue) => {
    let newValue = floatValue;
    let otherInputToUpdate = event.target.name === 'train' ? 'test' : 'train';

    if (floatValue < 0) {
      newValue = 0;
    }

    if (floatValue > 100) {
      newValue = 100;
    }

    this.setState({
      [event.target.name]: newValue,
      [otherInputToUpdate]: Math.abs(100 - newValue),
    });
  }

  handleChange = (event, maskedValue, floatValue) => {
    this.setState({ [event.target.name]: floatValue });
  }

  render() {
    const { train, test, time } = this.state;
    const { trainConfig } = this.props.dialog;
    const inputParams = {
      suffix: "%",
      className: "input",
      decimalSeparator: ".",
      thousandSeparator: "",
      onChangeEvent: this.handlePercentualChange
    };

    if (!trainConfig) {
      return null;
    }

    return (
      <Dialog>
        <DialogForm>
          <h1>Parâmetros do treinamento</h1>

          <DialogSpan>Informe o percentual de treinamento</DialogSpan>
          <CurrencyInput
            {...inputParams}
            value={train}
            name="train"
          />

          <DialogSpan>Informe o percentual de testes</DialogSpan>
          <CurrencyInput
            {...inputParams}
            value={test}
            name="test"
          />

          <DialogSpan>Tempo máx. execução em minutos</DialogSpan>
          <CurrencyInput
            {...inputParams}
            suffix=""
            precision="0"
            onChangeEvent={this.handleChange}
            value={time}
            name="time"
          />

          <DialogFormButtonContainer>
            <Button onClick={this.submit.bind(this)}>TREINAR</Button>
            <Button color="gray" isCancel={true} onClick={this.onClose}>Cancelar</Button>
          </DialogFormButtonContainer>

        </DialogForm>
      </Dialog>
    )
  }
}

const mapStateToProps = ({ dialog }) => ({ dialog });

export default connect(
  mapStateToProps, { ...DialogActions, ...toastrActions }
)(TrainConfigDialog);