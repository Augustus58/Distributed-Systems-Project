package distributedsystemsproject.domain;

import javax.persistence.Entity;
import org.springframework.data.jpa.domain.AbstractPersistable;

@Entity
public class Operation extends AbstractPersistable<Long> {

  private Double arg1;
  private Double arg2;
  private String op;
  private Double res;
  private String error;

  public Operation() {
  }

  public Operation(Double arg1, Double arg2, String op, Double res) {
    this.arg1 = arg1;
    this.arg2 = arg2;
    this.op = op;
    this.res = res;
  }

  public void setArg1(Double arg1) {
    this.arg1 = arg1;
  }

  public void setArg2(Double arg2) {
    this.arg2 = arg2;
  }

  public void setOp(String op) {
    this.op = op;
  }

  public void setRes(Double res) {
    this.res = res;
  }

  public void setError(String error) {
    this.error = error;
  }

  public Double getArg1() {
    return arg1;
  }

  public Double getArg2() {
    return arg2;
  }

  public String getOp() {
    return op;
  }

  public Double getRes() {
    return res;
  }
  
  public String getError() {
    return error;
  }

}
