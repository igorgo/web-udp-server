create or replace package UDO_PACKAGE_NODEWEB_IFACE is

  -- Author  : IGOR-GO
  -- Created : 18.05.2016 12:01:40
  -- Purpose : Интерфейс для node.js

  DEFAULT_COND_RN constant number := 4;

  type T_MOB_REP_REC is record(
    S01 PKG_STD.TSTRING,
    S02 PKG_STD.TSTRING,
    S03 PKG_STD.TSTRING,
    S04 PKG_STD.TSTRING,
    S05 PKG_STD.TSTRING,
    S06 PKG_STD.TSTRING,
    S07 PKG_STD.TSTRING,
    S08 PKG_STD.TSTRING,
    S09 PKG_STD.TSTRING,
    S10 PKG_STD.TSTRING,
    S11 PKG_STD.TSTRING,
    S12 PKG_STD.TSTRING,
    S13 PKG_STD.TSTRING,
    S14 PKG_STD.TSTRING,
    S15 PKG_STD.TSTRING,
    S16 PKG_STD.TSTRING,
    S17 PKG_STD.TSTRING,
    S18 PKG_STD.TSTRING,
    S19 PKG_STD.TSTRING,
    S20 PKG_STD.TSTRING,
    N01 number,
    N02 number,
    N03 number,
    N04 number,
    N05 number,
    N06 number,
    N07 number,
    N08 number,
    N09 number,
    N10 number,
    N11 number,
    N12 number,
    N13 number,
    N14 number,
    N15 number,
    N16 number,
    N17 number,
    N18 number,
    N19 number,
    N20 number,
    D01 date,
    D02 date,
    D03 date,
    D04 date,
    D05 date);

  --
  -- таблица для данных в моб. интерфейсе
  --
  type T_MOB_REP is table of T_MOB_REP_REC;

  function GET_CURRENT_RELEASES return T_MOB_REP
    pipelined;

  function GET_USERDATA return T_MOB_REP
    pipelined;

  procedure SET_USERDATA
  (
    A_PARAM_NAME in varchar2,
    A_VALUE_NUM  in number,
    A_VALUE_STR  in varchar2,
    A_VALUE_DATE in date
  );

  function GET_CONDITIONS_LIST return T_MOB_REP
    pipelined;

  procedure SET_ENV(IS_PMO out number);

  function GET_CLAIMS
  (
    A_COND   in number,
    A_SORT   in varchar2,
    A_OFFSET in number,
    A_LIMIT  in number,
    A_NEW_RN in number
  ) return T_MOB_REP
    pipelined;

  procedure GET_CONDITION
  (
    P_RN            in out number,
    P_FILTER_NAME   out varchar2,
    P_CLAIM_NUMB    out varchar2,
    P_CLAIM_VERS    out varchar2,
    P_CLAIM_RELEASE out varchar2,
    P_CLAIM_BUILD   out varchar2,
    P_CLAIM_UNIT    out varchar2,
    P_CLAIM_APP     out varchar2,
    P_CLAIM_IM_INIT out number,
    P_CLAIM_IM_PERF out number,
    P_CLAIM_CONTENT out varchar2
  );

  procedure CLEAR_CONDS;

  function GET_ALL_UNITS return T_MOB_REP
    pipelined;

  function GET_ALL_APPS return T_MOB_REP
    pipelined;

  function GET_ALL_BUILDS return T_MOB_REP
    pipelined;

  procedure STORE_FILTER
  (
    P_FILTER_RN     in number,
    P_FILTER_NAME   in varchar2,
    P_CLAIM_NUMB    in varchar2,
    P_CLAIM_VERS    in varchar2,
    P_CLAIM_RELEASE in varchar2,
    P_CLAIM_BUILD   in varchar2,
    P_CLAIM_UNIT    in varchar2,
    P_CLAIM_APP     in varchar2,
    P_CLAIM_IM_INIT in number,
    P_CLAIM_IM_PERF in number,
    P_CLAIM_CONTENT in varchar2,
    P_OUT_RN        out number
  );

  procedure DELETE_FILTER(P_FILTER_RN in number);

  /*
  select trim(S01) as "claimPrefix",
         trim(S02) as "claimNumber",
         S03 as "claimType",
         S04 as "claimState",
         S05 as "registeredByAgent",
         S06 as "changedByAgent",
         S07 as "executor",
         S08 as "buildFrom",
         S09 as "buildTo",
         S10 as "unit",
         S11 as "app",
         S12 as "action",
         S13 as "content",
         N01 as "rn",
         N02 as "priority",
         N03 as "helpSign",
         N04 as "claimTypeId",
         N05 as "exexGroupSign",
         D01 as "registeredAt",
         D02 as "changedAt",
         D03 as "execTill"
    from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CLAIM_RECORD(:RN))
      */
  function GET_CLAIM_RECORD(A_RN in number) return T_MOB_REP
    pipelined;

  /*
  select D01 as "date",
           S03 as "who",
           S04 as "newStatus",
           S05 as "newExecutor",
           S06 as "comment"
      from table(UDO_PACKAGE_NODEWEB_IFACE.CLAIM_HISTORY(:RN))
  */
  function CLAIM_HISTORY(P_RN in number) return T_MOB_REP
    pipelined;

  /*
    select S01 as "path",
           N01 as "id",
           N02 as "sizeBite"
      from table(UDO_PACKAGE_NODEWEB_IFACE.GET_CLAIM_FILES(:RN))
  */
  function GET_CLAIM_FILES(P_PRN in number) return T_MOB_REP
    pipelined;

  procedure GET_LINKED_DOC
  (
    P_RN       in number,
    P_FILESIZE out number,
    P_FILENAME out string,
    P_MIMETYPE out string,
    P_DOCDATA  out blob
  );

  procedure GET_AVAIL_ACTIONS
  (
    NRN         in number,
    NACTIONMASK out number
  );

  function GET_ALL_PERSON return T_MOB_REP
    pipelined;
		
  function GET_APPS_BY_UNIT(P_UNIT varchar2) return T_MOB_REP
    pipelined;
		
	function GET_FUNCS_BY_UNIT(P_UNIT varchar2) return T_MOB_REP
    pipelined;	

end UDO_PACKAGE_NODEWEB_IFACE;
/
create or replace package body UDO_PACKAGE_NODEWEB_IFACE is

  -- Author  : IGOR-GO
  -- Created : 18.05.2016 12:01:40
  -- Purpose : Интерфейс для node.js
  COND_STORE_GROUP        constant varchar2(13) := 'WEBUDP-CLAIMS';
  SESS_V_COND_IDENT       constant varchar2(15) := 'CONDITION_IDENT';
  SESS_V_DEPT_RN          constant varchar2(9) := 'DEPART_RN';
  SESS_V_PERS_RN          constant varchar2(9) := 'PERSON_RN';
  SESS_V_ISPMO            constant varchar2(6) := 'IS_PMO';
  PMO_DEPT_RN             constant INS_DEPARTMENT.RN%type := 1664602; -- подразделение ПМО
  DEFAULT_SORT_ORDER      constant varchar2(50) := 'CHANGE_DATE DESC';
  DEFAULT_LINKDOC_CATALOG constant ACATALOG.RN%type := 547;
  EVENT_TYPE_ADDON        constant number := 4412;
  EVENT_TYPE_REBUKE       constant number := 4424;
  EVENT_TYPE_ERROR        constant number := 4440;
  PERS_SERV_CRN           constant number := 1647644;
  EVENTS_UNITCODE         constant UNITLIST.UNITCODE%type := 'ClientEvents';
  ALL_REL_APPS            constant varchar2(50) := 'Всі, що пов''язані з розділом';

  G_EMPTY_REC T_MOB_REP_REC;

  TMP_STR varchar2(4000);
  TMP_NUM number;

  function TOK2IN_(STR varchar2) return varchar2 is
    DELIM  char(1) := ';';
    K      binary_integer;
    N      binary_integer;
    RETSTR PKG_STD.TSQL;
    CSTR   PKG_STD.TSTRING;
  begin
    N := STRCNT(STR,
                DELIM);
    if N > 1 then
      RETSTR := '';
      K      := 0;
      loop
        K    := K + 1;
        CSTR := trim(STRTOK(STR,
                            DELIM,
                            K));
        if CSTR is not null then
          RETSTR := STRCOMBINE(RETSTR,
                               '''' || CSTR || '''',
                               ',');
        end if;
        exit when K = N;
      end loop;
      if RETSTR is not null then
        return ' IN (' || RETSTR || ') ';
      else
        return ' IS NULL ';
      end if;
    else
      if STR is not null then
        return ' = ''' || STR || ''' ';
      else
        return ' IS NULL ';
      end if;
    end if;
  end;

  function GET_CURRENT_RELEASES return T_MOB_REP
    pipelined is
    cursor LC_RELEASES is
      select REL.RN,
             REL.RELNAME,
						 REL.SOFTVERSION,
             REL.RELDATE,
             BLD.BLDNUMB,
             BLD.BUILDATE,
             REL.RNK
        from (select R.RN,
                     R.RELNAME RELNAME,
                     R.BEGDATE RELDATE,
										 trim(R.SOFTVERSION) SOFTVERSION,
                     RANK() OVER(order by R.BEGDATE desc) RNK
                from UDO_SOFTRELEASES R
               where R.BEGDATE is not null) REL,
             (select *
                from (select B.CODE BLDNUMB,
                             B.BUILDATE,
                             B.PRN,
                             RANK() OVER(partition by B.PRN order by B.BUILDATE desc) RNK
                        from UDO_SOFTBUILDS B)
               where RNK = 1) BLD
       where BLD.PRN(+) = REL.RN
         and REL.RNK < 3
       order by REL.RNK;
    L_RELEASE LC_RELEASES%rowtype;
    cursor LC_STATS
    (
      A_REL  number,
      A_BETA number
    ) is
      select REL,
             sum(STATE) CLOSED,
             count(STATE) - sum(STATE) as OPENED
        from (select NVL(T2.SOFTRELEASE,
                         A_BETA) REL,
                     S.STATE
                from CLNEVENTS          T,
                     CLNEVENTS_EXT      T2,
                     UDO_CLAIM_STATUSES S
               where T.RN = T2.PRN
                 and T.EVENT_STAT = S.NEVENT_STAT
                 and ((T2.SOFTRELEASE is null and S.STATE = 0) or
                     (T2.SOFTRELEASE is not null)))
       where REL = A_REL
       group by REL;
    L_STAT    LC_STATS%rowtype;
    L_REC     T_MOB_REP_REC;
    L_BETA_RN number;
  begin
    open LC_RELEASES;
    loop
      fetch LC_RELEASES
        into L_RELEASE;
      exit when LC_RELEASES%notfound;
      L_REC     := G_EMPTY_REC;
      L_REC.S01 := L_RELEASE.RELNAME;
      L_REC.S02 := L_RELEASE.BLDNUMB;
      L_REC.S03 := L_RELEASE.SOFTVERSION;
      L_REC.D01 := L_RELEASE.RELDATE;
      L_REC.D02 := L_RELEASE.BUILDATE;
      if L_RELEASE.RNK = 1 then
        L_BETA_RN := L_RELEASE.RN;
      end if;
      open LC_STATS(L_RELEASE.RN,
                    L_BETA_RN);
      fetch LC_STATS
        into L_STAT;
      close LC_STATS;
      L_REC.N01 := L_STAT.OPENED;
      L_REC.N02 := L_STAT.CLOSED;
      pipe row(L_REC);
    end loop;
    close LC_RELEASES;
    null;
  end;

  function GET_USERDATA return T_MOB_REP
    pipelined is
    cursor LC_DATA is
      select * from WEBUDP_USERDATA D where D.AUTHID = UTILIZER;
    L_REC  T_MOB_REP_REC;
    L_DATA LC_DATA%rowtype;
  begin
    open LC_DATA;
    loop
      fetch LC_DATA
        into L_DATA;
      exit when LC_DATA%notfound;
      L_REC     := G_EMPTY_REC;
      L_REC.S02 := L_DATA.PARAM_NAME;
      L_REC.S01 := L_DATA.VALUE_STR;
      L_REC.N01 := L_DATA.VALUE_NUM;
      L_REC.D01 := L_DATA.VALUE_DATE;
      pipe row(L_REC);
    end loop;
    close LC_DATA;
  end;

  procedure SET_USERDATA
  (
    A_PARAM_NAME in varchar2,
    A_VALUE_NUM  in number,
    A_VALUE_STR  in varchar2,
    A_VALUE_DATE in date
  ) is
  begin
    merge into WEBUDP_USERDATA T
    using (select UTILIZER     as authid,
                  A_PARAM_NAME as PARAM_NAME,
                  A_VALUE_NUM  as VALUE_NUM,
                  A_VALUE_STR  as VALUE_STR,
                  A_VALUE_DATE as VALUE_DATE
             from DUAL) R
    on (R.AUTHID = T.AUTHID and R.PARAM_NAME = T.PARAM_NAME)
    when matched then
      update
         set T.VALUE_NUM  = R.VALUE_NUM,
             T.VALUE_STR  = R.VALUE_STR,
             T.VALUE_DATE = R.VALUE_DATE
    when not matched then
      insert
        (T.AUTHID, T.PARAM_NAME, T.VALUE_NUM, T.VALUE_STR, T.VALUE_DATE)
      values
        (R.AUTHID, R.PARAM_NAME, R.VALUE_NUM, R.VALUE_STR, R.VALUE_DATE);
  end;

  function GET_CONDITIONS_LIST return T_MOB_REP
    pipelined is
    cursor LC_FILTERS is
      select *
        from table(UDO_PKG_COND_STORE.V(COND_STORE_GROUP)) T
       order by T.EDITABLE,
                STORE_NAME;
    L_FILTER LC_FILTERS%rowtype;
    function FILTER_TO_REC(A_FILTER LC_FILTERS%rowtype) return T_MOB_REP_REC is
      LL_REC T_MOB_REP_REC;
    begin
      LL_REC     := G_EMPTY_REC;
      LL_REC.N01 := A_FILTER.RN;
      LL_REC.S01 := A_FILTER.STORE_NAME;
      LL_REC.S02 := A_FILTER.EDITABLE;
      return LL_REC;
    end;
  begin
    open LC_FILTERS;
    loop
      fetch LC_FILTERS
        into L_FILTER;
      exit when LC_FILTERS%notfound;
      pipe row(FILTER_TO_REC(L_FILTER));
    end loop;
    close LC_FILTERS;
  end;

  procedure SET_ENV(IS_PMO out number) as
    L_PERSON PKG_STD.TREF;
    L_DEP    PKG_STD.TREF;
    cursor L_CUR is
      select P.RN,
             PF.DEPTRN
        from CLNPERSONS P,
             CLNPSPFM   PF
       where P.PERS_AUTHID = UTILIZER
         and PF.PERSRN = P.RN
         and ((PF.ENDENG > sysdate) or (PF.ENDENG is null));
  begin
    -- проверяем работает ли текущий сотрудник в ПМО?
    open L_CUR;
    fetch L_CUR
      into L_PERSON,
           L_DEP;
    close L_CUR;
    PKG_SESSION_VARS.PUT(SESS_V_PERS_RN,
                         L_PERSON);
    PKG_SESSION_VARS.PUT(SESS_V_DEPT_RN,
                         L_DEP);
    PKG_SESSION_VARS.PUT(SESS_V_COND_IDENT,
                         GEN_IDENT);
    if L_DEP = PMO_DEPT_RN then
      IS_PMO := 1;
    else
      IS_PMO := 0;
    end if;
    PKG_SESSION_VARS.PUT(SESS_V_ISPMO,
                         IS_PMO);
  
  end;

  procedure SET_CONDS_
  (
    P_COND_RN in number,
    P_IDENT   in number
  ) is
    pragma autonomous_transaction;
  begin
    PKG_COND_BROKER.PROLOGUE(PKG_COND_BROKER.MODE_SMART_,
                             P_IDENT);
    PKG_COND_BROKER.SET_COMPANY(PKG_SESSION.GET_COMPANY);
    UDO_PKG_COND_STORE.SET_COND_TO_BROKER(NVL(P_COND_RN,
                                              UDO_PKG_COND_STORE.GET_DAEFAULT_STORE(COND_STORE_GROUP)));
    PKG_COND_BROKER.SET_CONDITION_NUM('APP_USER_PESRRN',
                                      PKG_SESSION_VARS.GET_NUM(SESS_V_PERS_RN));
    PKG_COND_BROKER.SET_CONDITION_NUM('APP_DEPRN',
                                      PKG_SESSION_VARS.GET_NUM(SESS_V_DEPT_RN));
    PKG_COND_BROKER.SET_PROCEDURE('UDO_P_WEBUDP_BASE_COND');
    PKG_COND_BROKER.EPILOGUE;
  end;

  procedure CLEAR_CONDS is
    L_IDENT PKG_STD.TREF;
  begin
    L_IDENT := PKG_SESSION_VARS.GET_NUM(SESS_V_COND_IDENT);
    delete from COND_BROKER_IDSMART S where S.IDENT = L_IDENT;
  end;

  function GET_CLAIM_RECORD(A_RN in number) return T_MOB_REP
    pipelined is
    cursor LC_CLAIM is
      select * from UDO_V_CLAIMS where NRN = A_RN;
    L_CLAIM LC_CLAIM%rowtype;
    L_REC   T_MOB_REP_REC;
  begin
    open LC_CLAIM;
    fetch LC_CLAIM
      into L_CLAIM;
    close LC_CLAIM;
    L_REC     := G_EMPTY_REC;
    L_REC.S01 := L_CLAIM.SEVENT_PREF;
    L_REC.S02 := L_CLAIM.SEVENT_NUMB;
    L_REC.S03 := L_CLAIM.SEVENT_TYPE;
    L_REC.S04 := L_CLAIM.SEVENT_STAT;
    L_REC.S05 := L_CLAIM.SINIT_PERSON_AGNCODE;
    L_REC.S06 := L_CLAIM.SCLIENT_PERSON_AGNCODE;
    L_REC.S07 := L_CLAIM.SEXECUTOR;
    L_REC.S08 := L_CLAIM.SBUILD_FROM;
    L_REC.S09 := L_CLAIM.SBUILD_TO2;
    L_REC.S10 := L_CLAIM.SUNITCODE;
    L_REC.S11 := L_CLAIM.SMODULE;
    L_REC.S12 := L_CLAIM.SUNITFUNC;
    L_REC.S13 := L_CLAIM.SEVENT_DESCR;
    L_REC.N01 := L_CLAIM.NRN;
    L_REC.N02 := L_CLAIM.NPRIORITY;
    L_REC.N03 := L_CLAIM.NHELPSIGN;
    L_REC.N04 := L_CLAIM.NEVENT_TYPE;
    L_REC.N05 := L_CLAIM.NGROUP_SIGN;
    L_REC.D01 := L_CLAIM.DREG_DATE;
    L_REC.D02 := L_CLAIM.DCHANGE_DATE;
    L_REC.D03 := L_CLAIM.DEXPIRE_DATE;
    pipe row(L_REC);
  end;

  function GET_CLAIMS
  (
    A_COND   in number,
    A_SORT   in varchar2,
    A_OFFSET in number,
    A_LIMIT  in number,
    A_NEW_RN in number
  ) return T_MOB_REP
    pipelined is
    cursor LC_LAST_CLAIM(A_RN number) is
      select T.*,
             0   as SEQ_NUM,
             1   as ALL_CNT
        from UDO_V_CLAIMS_MOBILE_IFACE T
       where T.RN = A_RN;
    L_SQL PKG_STD.TSQL;
    type T_EVN_COURSOR is ref cursor;
    L_EVN_COURSOR T_EVN_COURSOR;
    L_ENV_REC     LC_LAST_CLAIM%rowtype;
    L_START       binary_integer;
    L_END         binary_integer;
    L_IDENT       PKG_STD.TREF;
    L_SORT        PKG_STD.TSQL;
  
    function CLAIM_TO_REC(A_CLAIM in LC_LAST_CLAIM%rowtype)
      return T_MOB_REP_REC is
      LL_REC T_MOB_REP_REC;
    begin
      LL_REC     := G_EMPTY_REC;
      LL_REC.N01 := A_CLAIM.RN;
      --     N02  see below
      --     N03  see below
      LL_REC.N04 := A_CLAIM.STATUDPTYPE;
      LL_REC.N05 := A_CLAIM.PRIORITY;
      LL_REC.N06 := A_CLAIM.NEXISTDOC;
      --     N07    see below
      LL_REC.N10 := A_CLAIM.ALL_CNT;
      LL_REC.S01 := trim(A_CLAIM.EVENT_NUMB);
      LL_REC.S02 := A_CLAIM.REL_BLD_REL;
      LL_REC.S04 := A_CLAIM.UNITCODE;
      LL_REC.S05 := A_CLAIM.ACODE;
      LL_REC.S06 := A_CLAIM.EVNSTAT_CODE;
      LL_REC.S07 := A_CLAIM.INITIATOR;
      LL_REC.S08 := A_CLAIM.EVENT_DESCR;
      --     S09  see below
      LL_REC.D01 := A_CLAIM.REG_DATE;
      LL_REC.D02 := A_CLAIM.CHANGE_DATE;
    
      -- S09 & N08
      if A_CLAIM.EXECUTOR_DEP is null then
        if A_CLAIM.EXECUTOR != 'Архив' then
          LL_REC.S09 := A_CLAIM.EXECUTOR;
          LL_REC.N08 := 1;
        else
          LL_REC.S09 := '';
          LL_REC.N08 := 0;
        end if;
      else
        LL_REC.S09 := A_CLAIM.EXECUTOR_DEP;
        LL_REC.N08 := 2;
      end if;
      -- N02
      case A_CLAIM.EVENT_TYPE
        when EVENT_TYPE_ADDON then
          LL_REC.N02 := 1;
        when EVENT_TYPE_REBUKE then
          LL_REC.N02 := 2;
        when EVENT_TYPE_ERROR then
          LL_REC.N02 := 3;
      end case;
      -- N03
      if A_CLAIM.RELEASE_TO is null then
        LL_REC.N03 := 0;
      else
        LL_REC.N03 := 1;
      end if;
      -- N07
      if A_CLAIM.BLD_TO_RN is null then
        LL_REC.N07 := 0;
      else
        LL_REC.N07 := 1;
      end if;
    
      return LL_REC;
    end;
  
  begin
    L_START := A_OFFSET * A_LIMIT + 1;
    L_END   := (A_OFFSET + 1) * A_LIMIT;
    L_IDENT := PKG_SESSION_VARS.GET_NUM(SESS_V_COND_IDENT);
    L_SORT  := NVL(A_SORT,
                   DEFAULT_SORT_ORDER);
    if A_NEW_RN is not null then
      open LC_LAST_CLAIM(A_NEW_RN);
      fetch LC_LAST_CLAIM
        into L_ENV_REC;
      close LC_LAST_CLAIM;
      if L_ENV_REC.RN is not null then
        pipe row(CLAIM_TO_REC(L_ENV_REC));
      end if;
      L_END := L_END - 1;
    end if;
    SET_CONDS_(A_COND,
               L_IDENT);
    L_SQL := 'select * from (';
    L_SQL := L_SQL || ' select T.*, row_number() over ( order by ';
    L_SQL := L_SQL || L_SORT;
    L_SQL := L_SQL ||
             ' ) as seq_num, count(*) over () as all_cnt from UDO_V_CLAIMS_MOBILE_IFACE T where T.RN in';
    L_SQL := L_SQL ||
             ' (select S.ID from COND_BROKER_IDSMART S where S.IDENT = :A_IDENT)';
    L_SQL := L_SQL || ' ) where seq_num between :A_START and :A_END';
    -- p_exception(0,L_SQL);
    open L_EVN_COURSOR for L_SQL
      using L_IDENT, L_START, L_END;
    loop
      fetch L_EVN_COURSOR
        into L_ENV_REC;
      exit when L_EVN_COURSOR%notfound;
      if (A_NEW_RN is null) then
        pipe row(CLAIM_TO_REC(L_ENV_REC));
      elsif L_ENV_REC.RN != A_NEW_RN then
        pipe row(CLAIM_TO_REC(L_ENV_REC));
      end if;
    end loop;
    close L_EVN_COURSOR;
    -- CLEAR_CONDS_(L_IDENT, A_COND);
  end;

  procedure GET_CONDITION
  (
    P_RN            in out number,
    P_FILTER_NAME   out varchar2,
    P_CLAIM_NUMB    out varchar2,
    P_CLAIM_VERS    out varchar2,
    P_CLAIM_RELEASE out varchar2,
    P_CLAIM_BUILD   out varchar2,
    P_CLAIM_UNIT    out varchar2,
    P_CLAIM_APP     out varchar2,
    P_CLAIM_IM_INIT out number,
    P_CLAIM_IM_PERF out number,
    P_CLAIM_CONTENT out varchar2
  ) is
    L_RN PKG_STD.TREF;
  begin
    L_RN := P_RN;
    if L_RN is not null then
      P_FILTER_NAME := UDO_PKG_COND_STORE.FIND_NAME_BY_RN(L_RN);
    else
      L_RN := UDO_PKG_COND_STORE.GET_DAEFAULT_STORE(COND_STORE_GROUP);
    end if;
    if L_RN is not null then
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_NUMBER',
                                            P_CLAIM_NUMB);
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_VERSION',
                                            P_CLAIM_VERS);
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_RELEASE',
                                            P_CLAIM_RELEASE);
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_BUILD',
                                            P_CLAIM_BUILD);
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_UNITCODE',
                                            P_CLAIM_UNIT);
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_APPLICATION',
                                            P_CLAIM_APP);
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_INIT_IS_ME',
                                            P_CLAIM_IM_INIT);
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_PERF_IS_ME',
                                            P_CLAIM_IM_PERF);
      UDO_PKG_COND_STORE.GET_STORE_ATTR_VAL(L_RN,
                                            'APP_COND_CONTENT',
                                            P_CLAIM_CONTENT);
    end if;
  end;

  function GET_ALL_UNITS return T_MOB_REP
    pipelined is
    cursor LC_UNITS is
      select distinct UNAME from MV_UNITFUNK order by UNAME;
    L_UNIT LC_UNITS %rowtype;
    L_REC  T_MOB_REP_REC;
  begin
    open LC_UNITS;
    loop
      fetch LC_UNITS
        into L_UNIT;
      exit when LC_UNITS%notfound;
      L_REC.S01 := L_UNIT.UNAME;
      pipe row(L_REC);
    end loop;
    close LC_UNITS;
  end;

  function GET_ALL_APPS return T_MOB_REP
    pipelined is
    cursor LC_APPS is
      select distinct ANAME from MV_UNITFUNK order by ANAME;
    L_APP LC_APPS %rowtype;
    L_REC T_MOB_REP_REC;
  begin
    open LC_APPS;
    loop
      fetch LC_APPS
        into L_APP;
      exit when LC_APPS%notfound;
      L_REC.S01 := L_APP.ANAME;
      pipe row(L_REC);
    end loop;
    close LC_APPS;
  end;

  function GET_ALL_BUILDS return T_MOB_REP
    pipelined is
    cursor LC_BLDS is
      select trim(R.SOFTVERSION) as VERSION,
             R.RELNAME as RELEASE,
             B.NAME as BUILD,
             B.BUILDATE
        from UDO_SOFTRELEASES R,
             UDO_SOFTBUILDS   B
       where B.PRN(+) = R.RN
       order by R.SOFTVERSION,
                R.RELNUMB,
                B.BUILDATE;
    L_BLDS LC_BLDS %rowtype;
    L_REC  T_MOB_REP_REC;
  begin
    open LC_BLDS;
    loop
      fetch LC_BLDS
        into L_BLDS;
      exit when LC_BLDS%notfound;
      L_REC.S01 := L_BLDS.VERSION;
      L_REC.S02 := L_BLDS.RELEASE;
      L_REC.S03 := L_BLDS.BUILD;
      L_REC.D01 := L_BLDS.BUILDATE;
      pipe row(L_REC);
    end loop;
    close LC_BLDS;
  end;

  procedure STORE_FILTER
  (
    P_FILTER_RN     in number,
    P_FILTER_NAME   in varchar2,
    P_CLAIM_NUMB    in varchar2,
    P_CLAIM_VERS    in varchar2,
    P_CLAIM_RELEASE in varchar2,
    P_CLAIM_BUILD   in varchar2,
    P_CLAIM_UNIT    in varchar2,
    P_CLAIM_APP     in varchar2,
    P_CLAIM_IM_INIT in number,
    P_CLAIM_IM_PERF in number,
    P_CLAIM_CONTENT in varchar2,
    P_OUT_RN        out number
  ) is
  begin
    UDO_PKG_COND_STORE.PROLOGUE(P_RN         => P_FILTER_RN,
                                P_COND_GROUP => COND_STORE_GROUP,
                                P_STORE_NAME => P_FILTER_NAME);
    /*
        UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_USER_PESRRN',
                                       P_VALUE => PKG_SESSION_VARS.GET_NUM(SESS_V_PERS_RN));
        UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_DEPRN',
                                       P_VALUE => PKG_SESSION_VARS.GET_NUM(SESS_V_DEPT_RN));
        APP_COND_CONTENT_IN_NOTE = 1
    */
  
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_NUMBER',
                                 P_VALUE => P_CLAIM_NUMB);
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_VERSION',
                                 P_VALUE => P_CLAIM_VERS);
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_RELEASE',
                                 P_VALUE => P_CLAIM_RELEASE);
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_BUILD',
                                 P_VALUE => P_CLAIM_BUILD);
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_UNITCODE',
                                 P_VALUE => P_CLAIM_UNIT);
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_APPLICATION',
                                 P_VALUE => P_CLAIM_APP);
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_INIT_IS_ME',
                                 P_VALUE => P_CLAIM_IM_INIT);
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_PERF_IS_ME',
                                 P_VALUE => P_CLAIM_IM_PERF);
    UDO_PKG_COND_STORE.ADD_VALUE(P_NAME  => 'APP_COND_CONTENT',
                                 P_VALUE => P_CLAIM_CONTENT);
  
    UDO_PKG_COND_STORE.EPILOGUE(P_RN => P_OUT_RN);
  end;

  procedure DELETE_FILTER(P_FILTER_RN in number) is
  begin
    UDO_PKG_COND_STORE.DEL(P_FILTER_RN);
  end;

  function CLAIM_HISTORY(P_RN in number) return T_MOB_REP
    pipelined is
    FLAG_COMMENT_OTHER  constant varchar2(1) := 'O';
    FLAG_NOCOMMENT      constant varchar2(1) := 'N';
    FLAG_COMMENT_AUTHOR constant varchar2(1) := 'A';
    FLAG_IGNORE         constant varchar2(1) := 'I';
  
    ACT_NOTE constant varchar2(17) := 'CLNEVNOTES_INSERT';
    ACT_FWD  constant varchar2(22) := 'CLNEVENTS_CHANGE_STATE';
    ACT_NULL constant varchar2(15) := 'CLNEVENTS_CLOSE';
    ACT_RET  constant varchar2(16) := 'CLNEVENTS_RETURN';
    ACT_SEND constant varchar2(17) := 'CLNEVENTS_DO_SEND';
    ACT_UPD  constant varchar2(16) := 'CLNEVENTS_UPDATE';
    ACT_INS  constant varchar2(16) := 'CLNEVENTS_INSERT';
  
    ACT_NOTE_N             constant binary_integer := 1;
    ACT_FWD_N              constant binary_integer := 2;
    ACT_NULL_N             constant binary_integer := 3;
    ACT_RET_N              constant binary_integer := 4;
    ACT_SEND_N             constant binary_integer := 5;
    ACT_UPD_N              constant binary_integer := 6;
    ACT_INS_N              constant binary_integer := 7;
    MAX_SHIFT_BETWEEN_NOTE constant number := 1 / 24 / 60 * 5; -- 5 min
  
    cursor LC_HISTORY is
      select 'I' as CFLAG,
             H.DCHANGE_DATE,
             H.SAUTHNAME,
             H.SACTION_CODE,
             0 as NACTION_CODE,
             H.SEVENT_TYPE_NAME,
             H.SSEND,
             H.STEXT
        from UDO_V_CLAIM_HIST H
       where H.NPRN = P_RN
       order by DCHANGE_DATE asc;
    type T_HISTTAB is table of LC_HISTORY%rowtype index by binary_integer;
    L_HISTTAB    T_HISTTAB;
    L_AUTHOR     UDO_V_CLAIM_HIST.SAUTHNAME%type;
    L_LAST_DESCR UDO_V_CLAIM_HIST.STEXT%type;
    L_TRIGGER    boolean;
    L_REC        T_MOB_REP_REC;
  begin
    open LC_HISTORY;
    fetch LC_HISTORY bulk collect
      into L_HISTTAB;
    close LC_HISTORY;
  
    for I in 1 .. L_HISTTAB.COUNT loop
      case L_HISTTAB(I).SACTION_CODE
        when ACT_INS then
          L_HISTTAB(I).NACTION_CODE := ACT_INS_N;
          L_AUTHOR := L_HISTTAB(I).SAUTHNAME;
          L_HISTTAB(I).CFLAG := FLAG_COMMENT_AUTHOR;
          L_LAST_DESCR := L_HISTTAB(I).STEXT;
        when ACT_UPD then
          L_HISTTAB(I).NACTION_CODE := ACT_UPD_N;
          if (L_HISTTAB(I).STEXT is not null) and
             (L_HISTTAB(I).STEXT != L_LAST_DESCR) then
            L_HISTTAB(I).CFLAG := FLAG_COMMENT_AUTHOR;
            L_LAST_DESCR := L_HISTTAB(I).STEXT;
          end if;
        when ACT_SEND then
          L_HISTTAB(I).NACTION_CODE := ACT_SEND_N;
          if L_HISTTAB(I).CFLAG = FLAG_IGNORE then
            L_HISTTAB(I).CFLAG := FLAG_NOCOMMENT;
          end if;
        when ACT_RET then
          L_HISTTAB(I).NACTION_CODE := ACT_RET_N;
          if L_HISTTAB(I).CFLAG = FLAG_IGNORE then
            L_HISTTAB(I).CFLAG := FLAG_NOCOMMENT;
          end if;
        when ACT_NULL then
          L_HISTTAB(I).NACTION_CODE := ACT_NULL_N;
          if L_HISTTAB(I).CFLAG = FLAG_IGNORE then
            L_HISTTAB(I).CFLAG := FLAG_NOCOMMENT;
          end if;
        when ACT_FWD then
          L_HISTTAB(I).NACTION_CODE := ACT_FWD_N;
          if L_HISTTAB(I).CFLAG = FLAG_IGNORE then
            L_HISTTAB(I).CFLAG := FLAG_NOCOMMENT;
          end if;
        when ACT_NOTE then
          L_HISTTAB(I).NACTION_CODE := ACT_NOTE_N;
          L_TRIGGER := true;
          if I > 1 then
            if ((L_HISTTAB(I - 1)
               .CFLAG = FLAG_NOCOMMENT or L_HISTTAB(I - 1).CFLAG =
                FLAG_IGNORE) and
               (L_HISTTAB(I - 1).SAUTHNAME = L_HISTTAB(I).SAUTHNAME) and
               ((L_HISTTAB(I).DCHANGE_DATE - L_HISTTAB(I - 1).DCHANGE_DATE) <
               MAX_SHIFT_BETWEEN_NOTE)) then
              L_TRIGGER := false;
              if L_HISTTAB(I).SAUTHNAME = L_AUTHOR then
                L_HISTTAB(I - 1).CFLAG := FLAG_COMMENT_AUTHOR;
              else
                L_HISTTAB(I - 1).CFLAG := FLAG_COMMENT_OTHER;
              end if;
              L_HISTTAB(I - 1).STEXT := L_HISTTAB(I).STEXT;
            end if;
          end if;
          if (I < L_HISTTAB.COUNT) and L_TRIGGER then
            if ((L_HISTTAB(I + 1)
               .CFLAG = FLAG_NOCOMMENT or L_HISTTAB(I + 1).CFLAG =
                FLAG_IGNORE) and
               (L_HISTTAB(I + 1).SAUTHNAME = L_HISTTAB(I).SAUTHNAME) and
               ((L_HISTTAB(I + 1).DCHANGE_DATE - L_HISTTAB(I).DCHANGE_DATE) <
               MAX_SHIFT_BETWEEN_NOTE)) then
              L_TRIGGER := false;
              if L_HISTTAB(I).SAUTHNAME = L_AUTHOR then
                L_HISTTAB(I + 1).CFLAG := FLAG_COMMENT_AUTHOR;
              else
                L_HISTTAB(I + 1).CFLAG := FLAG_COMMENT_OTHER;
              end if;
              L_HISTTAB(I + 1).STEXT := L_HISTTAB(I).STEXT;
            end if;
          end if;
          if L_TRIGGER then
            if L_HISTTAB(I).SAUTHNAME = L_AUTHOR then
              L_HISTTAB(I).CFLAG := FLAG_COMMENT_AUTHOR;
            else
              L_HISTTAB(I).CFLAG := FLAG_COMMENT_OTHER;
            end if;
          end if;
        else
          null;
      end case;
    end loop;
    for I in 1 .. L_HISTTAB.COUNT loop
      if L_HISTTAB(I).CFLAG != FLAG_IGNORE and L_HISTTAB(I)
         .NACTION_CODE not in (6,
                               7) then
        /* S01-Flag
           S02-Date
           S03-Who
           S04-New state
           S05-Whom
           S06-Text
           N01-Action
        */
        L_REC     := G_EMPTY_REC;
        L_REC.S01 := L_HISTTAB(I).CFLAG;
        L_REC.D01 := L_HISTTAB(I).DCHANGE_DATE;
        L_REC.S03 := L_HISTTAB(I).SAUTHNAME;
        L_REC.N01 := L_HISTTAB(I).NACTION_CODE;
        if L_HISTTAB(I).NACTION_CODE in (ACT_FWD_N,
                             ACT_RET_N) then
          L_REC.S04 := L_HISTTAB(I).SEVENT_TYPE_NAME;
        end if;
        if L_HISTTAB(I).NACTION_CODE in (ACT_FWD_N,
                             ACT_RET_N,
                             ACT_SEND_N) then
          L_REC.S05 := L_HISTTAB(I).SSEND;
        end if;
        L_REC.S06 := L_HISTTAB(I).STEXT;
        pipe row(L_REC);
      end if;
    end loop;
  end;

  function GET_CLAIM_FILES(P_PRN in number) return T_MOB_REP
    pipelined is
    cursor LC_DOCS is
      select NRN,
             SFILE_PATH,
             NVL(NSIZE,
                 0) NSIZE
        from UDO_V_CLAIMS_FILELINKS M
       where NPRN = P_PRN
       order by SCODE;
    L_DOC LC_DOCS%rowtype;
    L_REC T_MOB_REP_REC;
  begin
    open LC_DOCS;
    loop
      fetch LC_DOCS
        into L_DOC;
      exit when LC_DOCS%notfound;
      L_REC     := G_EMPTY_REC;
      L_REC.S01 := L_DOC.SFILE_PATH;
      L_REC.N01 := L_DOC.NRN;
      L_REC.N02 := L_DOC.NSIZE;
      pipe row(L_REC);
    end loop;
    close LC_DOCS;
  end;

  procedure GET_LINKED_DOC
  (
    P_RN       in number,
    P_FILESIZE out number,
    P_FILENAME out string,
    P_MIMETYPE out string,
    P_DOCDATA  out blob
  ) is
  
    cursor LC_DOC is
      select FILE_PATH,
             BDATA,
             CDATA
        from FILELINKS M
       where RN = P_RN;
    L_DOC LC_DOC%rowtype;
  
    function C2B(C clob) return blob is
      LL_BLB          blob;
      LL_DEST_OFFSET  integer;
      LL_SRC_OFFSET   integer;
      LL_LANG_CONTEXT integer;
      LL_WARNING      varchar2(2000);
    begin
      DBMS_LOB.CREATETEMPORARY(LL_BLB,
                               false);
      LL_DEST_OFFSET  := 1;
      LL_SRC_OFFSET   := 1;
      LL_LANG_CONTEXT := 0;
      DBMS_LOB.CONVERTTOBLOB(LL_BLB,
                             C,
                             DBMS_LOB.GETLENGTH(C),
                             LL_DEST_OFFSET,
                             LL_SRC_OFFSET,
                             0,
                             LL_LANG_CONTEXT,
                             LL_WARNING);
      return LL_BLB;
    end;
  
  begin
    open LC_DOC;
    fetch LC_DOC
      into L_DOC;
    close LC_DOC;
    if DBMS_LOB.GETLENGTH(L_DOC.BDATA) > 0 then
      P_DOCDATA := L_DOC.BDATA;
    elsif DBMS_LOB.GETLENGTH(L_DOC.CDATA) > 0 then
      P_DOCDATA := C2B(L_DOC.CDATA);
    else
      P_DOCDATA := null;
    end if;
    P_MIMETYPE := UDO_GET_FILE_CONTENTTYPE(L_DOC.FILE_PATH);
    P_FILESIZE := DBMS_LOB.GETLENGTH(P_DOCDATA);
    P_FILENAME := L_DOC.FILE_PATH;
  end;

  procedure GET_AVAIL_ACTIONS
  (
    NRN         in number,
    NACTIONMASK out number
  ) is
  
    BUPDATE     constant binary_integer := 1;
    BDELETE     constant binary_integer := 2;
    BSTATE      constant binary_integer := 4;
    BSEND       constant binary_integer := 8;
    BRETURN     constant binary_integer := 16;
    BCLOSE      constant binary_integer := 32;
    BADDNOTE    constant binary_integer := 64;
    BADDDOCUM   constant binary_integer := 128;
    BPRIORITIZE constant binary_integer := 256;
    BHELPNEED   constant binary_integer := 512;
    BHELPSTAT   constant binary_integer := 1024;
  
    L_BSTATE  boolean;
    L_BRETURN boolean;
  
    cursor LC_EVENT is
      select E.CRN,
             PERS.PERS_AUTHID,
             E.EVENT_TYPE,
             E.EVENT_STAT
        from CLNEVENTS  E,
             CLNPERSONS PERS
       where E.RN = NRN
         and E.INIT_PERSON = PERS.RN;
  
    cursor LC_NEXTPOINTS
    (
      A_EVENT_TYPE   number,
      A_EVENT_STATUS number
    ) is
      select count(*)
        from DUAL
       where exists (select *
                from EVROUTES   R,
                     EVRTPOINTS M
               where M.PRN = R.RN
                 and R.EVENT_TYPE = A_EVENT_TYPE
                 and M.EVENT_STATUS = A_EVENT_STATUS);
  
    L_EVENT      LC_EVENT%rowtype;
    IS_PMO       boolean;
    IS_INITIATOR boolean;
    HAS_POINTS   number;
    L_RESULT     number := 0;
  
    function CHECK_RIGHT
    (
      A_CATALOG    number,
      A_ACTIONCODE varchar2,
      A_UNITCODE   varchar2 default EVENTS_UNITCODE
    ) return boolean is
      NRESULT number;
      cursor LC_CHECK_RIGHT is
        select count(*)
          from DUAL
         where exists (select /*+ INDEX(UP I_USERPRIV_CATALOG_AUTHID) INDEX(CP C_UNITPRIV_UK) */
                 null
                  from USERPRIV UP,
                       UNITPRIV CP
                 where UP.RN = CP.PRN
                   and CP.FUNC = A_ACTIONCODE
                   and UP.UNITCODE = A_UNITCODE
                   and UP.CATALOG = A_CATALOG
                   and UP.AUTHID = UTILIZER
                union all
                select /*+ INDEX(UP I_USERPRIV_CATALOG_ROLEID) INDEX(CP C_UNITPRIV_UK) */
                 null
                  from USERPRIV UP,
                       UNITPRIV CP
                 where UP.RN = CP.PRN
                   and CP.FUNC = A_ACTIONCODE
                   and UP.UNITCODE = A_UNITCODE
                   and UP.CATALOG = A_CATALOG
                   and UP.ROLEID in
                       (select /*+ INDEX(UR I_USERROLES_AUTHID_FK) */
                         UR.ROLEID
                          from USERROLES UR
                         where UR.AUTHID = UTILIZER));
    begin
      NRESULT := PKG_SESSION_VARS.GET_NUM(A_ACTIONCODE);
      if NRESULT is not null then
        return(NRESULT = 1);
      end if;
      open LC_CHECK_RIGHT;
      fetch LC_CHECK_RIGHT
        into NRESULT;
      close LC_CHECK_RIGHT;
      PKG_SESSION_VARS.PUT(SNAME  => A_ACTIONCODE,
                           NVALUE => NRESULT);
      return(NRESULT = 1);
    end CHECK_RIGHT;
  
    function CHECK_RIGHTS_EX(A_ACTION_CODE in number) return boolean is
      NRESULT number;
    begin
      begin
        P_EVRTPTEXEC_CHECK_RIGHTS_EX(PKG_SESSION.GET_COMPANY,
                                     NRN,
                                     null,
                                     A_ACTION_CODE,
                                     NRESULT);
      exception
        when others then
          return false;
      end;
      return(NRESULT = 1);
    end CHECK_RIGHTS_EX;
  
    function BOOL_TO_INT(B in boolean) return number is
      NRESULT number;
    begin
      if B then
        NRESULT := 1;
      elsif not B then
        NRESULT := 0;
      else
        NRESULT := null;
      end if;
      return NRESULT;
    end;
  
  begin
    open LC_EVENT;
    fetch LC_EVENT
      into L_EVENT;
    close LC_EVENT;
    if L_EVENT.CRN is null then
      return;
    end if;
    IS_PMO       := PKG_SESSION_VARS.GET_NUM(SESS_V_ISPMO) = 1;
    IS_INITIATOR := (L_EVENT.PERS_AUTHID = UTILIZER);
  
    L_RESULT := L_RESULT +
                BUPDATE * BOOL_TO_INT(CHECK_RIGHT(L_EVENT.CRN,
                                                  'CLAIM_UPDATE') and
                                      (IS_PMO or IS_INITIATOR));
    L_RESULT := L_RESULT +
                BDELETE *
                BOOL_TO_INT(CHECK_RIGHT(L_EVENT.CRN,
                                        'CLAIM_DELETE'));
    L_RESULT := L_RESULT +
                BSEND * BOOL_TO_INT(CHECK_RIGHT(L_EVENT.CRN,
                                                'CLAIM_DO_SEND') and
                                    CHECK_RIGHTS_EX(3));
    L_RESULT := L_RESULT +
                BCLOSE * BOOL_TO_INT(CHECK_RIGHT(L_EVENT.CRN,
                                                 'CLAIM_CLOSE') and
                                     CHECK_RIGHTS_EX(5));
    L_RESULT := L_RESULT +
                BPRIORITIZE *
                BOOL_TO_INT(CHECK_RIGHT(L_EVENT.CRN,
                                        'CLNEVENTS_SET_PRIORITY'));
    L_RESULT := L_RESULT +
                BADDNOTE *
                BOOL_TO_INT(CHECK_RIGHT(L_EVENT.CRN,
                                        'CLNEVNOTES_INSERT'));
    L_RESULT := L_RESULT + BADDDOCUM *
                BOOL_TO_INT(CHECK_RIGHT(DEFAULT_LINKDOC_CATALOG,
                                                   'FILELINKS_INSERT',
                                                   'FileLinks'));
    L_RESULT := L_RESULT +
                BHELPNEED *
                BOOL_TO_INT(CHECK_RIGHT(L_EVENT.CRN,
                                        'CLAIM_HELPSIGN_NEED'));
    L_RESULT := L_RESULT +
                BHELPSTAT *
                BOOL_TO_INT(CHECK_RIGHT(L_EVENT.CRN,
                                        'CLAIM_HELPSIGN_STAT'));
  
    L_BSTATE := CHECK_RIGHT(L_EVENT.CRN,
                            'CLAIM_CHANGE_STATE') and CHECK_RIGHTS_EX(2);
    if L_BSTATE then
      open LC_NEXTPOINTS(L_EVENT.EVENT_TYPE,
                         L_EVENT.EVENT_STAT);
      fetch LC_NEXTPOINTS
        into HAS_POINTS;
      close LC_NEXTPOINTS;
      L_BSTATE := L_BSTATE and (HAS_POINTS > 0);
    end if;
    L_RESULT := L_RESULT + BSTATE * BOOL_TO_INT(L_BSTATE);
  
    L_BRETURN := CHECK_RIGHT(L_EVENT.CRN,
                             'CLAIM_RETURN') and CHECK_RIGHTS_EX(4);
    if L_BRETURN then
      begin
        FIND_CLNEVENTS_RETPOINT(PKG_SESSION.GET_COMPANY,
                                NRN                     => NRN,
                                NPOINT_OUT              => TMP_NUM,
                                SCOMMENTRY              => TMP_STR);
      exception
        when others then
          L_BRETURN := false;
      end;
    end if;
    L_RESULT    := L_RESULT + BRETURN * BOOL_TO_INT(L_BRETURN);
    NACTIONMASK := L_RESULT;
  end;


  function GET_ALL_PERSON return T_MOB_REP
    pipelined is
    cursor LC_PERS is
      select SPERS_AGENT || ' (' || SOWNER_AGENT || ')' as LBL,
             replace(SCODE,' ','#') as SCODE
        from V_CLNPERSONS
       where DDISMISS_DATE is null
         and NCRN != PERS_SERV_CRN
       order by 1;
    L_PERS LC_PERS%rowtype;
    L_REC  T_MOB_REP_REC;
  begin
    open LC_PERS;
    loop
      fetch LC_PERS
        into L_PERS;
      exit when LC_PERS%notfound;
      L_REC     := G_EMPTY_REC;
      L_REC.S01 := L_PERS.LBL;
      L_REC.S02 := L_PERS.SCODE;
      pipe row(L_REC);
    end loop;
    close LC_PERS;
  end;

  function GET_APPS_BY_UNIT(P_UNIT varchar2) return T_MOB_REP
    pipelined is
    L_SQL PKG_STD.TSQL;
    type T_APP_COURSOR is ref cursor;
    L_APP_COURSOR T_APP_COURSOR;
    L_REC         T_MOB_REP_REC;
  begin
    L_SQL     := 'select distinct ANAME ';
    L_SQL     := L_SQL || '  from MV_UNITFUNK';
    L_SQL     := L_SQL || ' where UNAME ';
    L_SQL     := L_SQL || TOK2IN_(P_UNIT);
    L_SQL     := L_SQL || ' order by ANAME';
    L_REC     := G_EMPTY_REC;
    L_REC.S01 := ALL_REL_APPS;
    pipe row(L_REC);
    open L_APP_COURSOR for L_SQL;
    loop
      L_REC := G_EMPTY_REC;
      fetch L_APP_COURSOR
        into L_REC.S01;
      exit when L_APP_COURSOR%notfound;
      pipe row(L_REC);
    end loop;
    close L_APP_COURSOR;
  end;

  function GET_FUNCS_BY_UNIT(P_UNIT varchar2) return T_MOB_REP
    pipelined is
    cursor LC_FUNC is
      select distinct FNAME,
                      FNUMB
        from MV_UNITFUNK
       where UNAME = P_UNIT
       order by FNUMB;
    L_FUNC LC_FUNC%rowtype;
    L_REC  T_MOB_REP_REC;
  begin
    open LC_FUNC;
    loop
      fetch LC_FUNC
        into L_FUNC;
      exit when LC_FUNC%notfound;
      L_REC     := G_EMPTY_REC;
      L_REC.S01 := L_FUNC.FNAME;
      pipe row(L_REC);
    end loop;
    close LC_FUNC;
  end;

begin
  -- Initialization
  null;
end UDO_PACKAGE_NODEWEB_IFACE;
/
